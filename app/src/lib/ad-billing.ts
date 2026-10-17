import { sql } from '@payloadcms/db-postgres'
import { z } from 'zod'

import type { AdSlot, Banner, Customer } from '@/payload-types'

import { placementFor } from './ad-placements'
import { LIVE, NOT_SET_UP, paidUntilOf, statusOf, stripeCustomerFor, type Sub } from './billing'
import { CHECK, TOO_SOON_ERROR, fail, isOwner, tooSoon, mediaIds, notifyTeam, payloadClient, relId, saveFailed, settlePhotos, takePhotos, toFields, zodErrors, type CabinetResult, type PhotoChange } from './cabinet'
import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'
import { automaticTaxParams, managedPaymentsParams, productTaxCode, stripe, stripeEnabled, StripeError, TAX_BEHAVIOR } from './stripe'

// Stage 3, step 5: banner places bought online. A place is one AdSlot code with
// a price in lib/ad-placements.ts; it is sold by the month through Stripe
// Checkout. Paying creates the banner as a draft (owner, slot, dates); the buyer
// uploads the picture in the account, which sends it to the team as Pending
// review; the team publishes it. Every paid month moves endAt on; cancelling
// lets the banner run to the end of the paid month. The webhook is shared with
// packages (lib/billing.ts): these subscriptions carry metadata kind=banner.

export const adSchema = z.object({
  advertiser: z.string().trim().min(2, 'Please enter the advertiser name').max(120),
  linkUrl: z
    .string()
    .trim()
    .max(400)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .refine((v) => URL.canParse(v) && v.includes('.'), 'Enter the web address a click should open'),
})

/** A place counts as taken while a paid banner runs there, or one bought online is still paid for (even before its picture is up). */
export async function slotTaken(slotId: number, now = new Date()) {
  const payload = await payloadClient()
  const { totalDocs } = await payload.count({
    collection: 'banners',
    where: {
      and: [
        { slots: { contains: slotId } },
        { or: [{ isDemo: { equals: false } }, { isDemo: { exists: false } }] },
        { endAt: { greater_than: now.toISOString() } },
        {
          or: [
            { and: [{ status: { equals: 'published' } }, { startAt: { less_than_equal: now.toISOString() } }] },
            { subscriptionStatus: { in: [...LIVE] } },
          ],
        },
      ],
    },
    overrideAccess: true,
  })
  return totalDocs > 0
}

/** Slot codes bought online but not on the site yet — /advertise shows them as Booked too. */
export async function reservedSlotCodes(now = new Date()): Promise<Set<string>> {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'banners',
    where: { and: [{ subscriptionStatus: { in: [...LIVE] } }, { endAt: { greater_than: now.toISOString() } }] },
    depth: 1,
    limit: 200,
    overrideAccess: true,
  })
  return new Set(docs.flatMap((b) => (b.slots ?? []).flatMap((s) => (typeof s === 'object' && s ? [(s as AdSlot).code] : []))))
}

export async function slotByCode(code: string) {
  const payload = await payloadClient()
  const slot = (await payload.find({ collection: 'ad-slots', where: { code: { equals: code } }, limit: 1, depth: 0 })).docs[0] as AdSlot | undefined
  const placement = placementFor(code)
  return slot && slot.isActive && placement ? { slot, placement } : null
}

/** Stripe Checkout for a banner place (one slot code). */
export async function startAdCheckout(customer: Customer, fd: FormData): Promise<CabinetResult & { url?: string }> {
  if (!stripeEnabled()) return fail(503, NOT_SET_UP)
  const found = await slotByCode(String(fd.get('slot') ?? ''))
  if (!found) return fail(400, CHECK, { slot: 'Choose a place' })
  const { slot, placement } = found
  const parsed = adSchema.safeParse(toFields(fd))
  if (!parsed.success) return fail(400, CHECK, zodErrors(parsed.error.issues))
  if (fd.get('consent') !== 'yes') return fail(400, CHECK, { consent: 'Please confirm the monthly payment' })
  if (await slotTaken(slot.id)) return fail(409, 'This place has just been taken. Please choose another one.')

  const meta = { kind: 'banner', slotId: slot.id, slotCode: slot.code, customerId: customer.id, advertiser: parsed.data.advertiser, linkUrl: parsed.data.linkUrl }
  try {
    const session = await stripe<{ url: string }>('POST', '/checkout/sessions', {
      mode: 'subscription',
      ...managedPaymentsParams(),
      ...automaticTaxParams(),
      customer: await stripeCustomerFor(customer),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(placement.price * 100),
            recurring: { interval: 'month' },
            tax_behavior: TAX_BEHAVIOR,
            product_data: { name: `AllSeattle banner — ${slot.name}`, tax_code: productTaxCode(), metadata: { slotCode: slot.code } },
          },
        },
      ],
      subscription_data: { description: `Banner ${slot.name} for ${parsed.data.advertiser}`, metadata: meta },
      metadata: meta,
      // No custom_text: Stripe's Managed Payments (on by default for new accounts) rejects it.
      // The monthly-charge consent is the checkbox on our page before this step.
      success_url: absoluteUrl('/account/ads?paid=1'),
      cancel_url: absoluteUrl(`/account/ads/new?slot=${encodeURIComponent(slot.code)}`),
    })
    return { ok: true, id: slot.id, message: 'Redirecting to payment…', url: session.url }
  } catch (e) {
    console.error('[ads] checkout failed', e)
    return fail(502, e instanceof StripeError && e.status < 500 ? `Payment could not start: ${e.message}` : 'Payment could not start. Please try again in a minute.')
  }
}

/** The banner side of the webhook: create it on the first payment, move endAt on with every one. */
export async function syncAdSubscription(sub: Sub, _opts: { welcome?: boolean } = {}) {
  const status = statusOf(sub)
  const slotId = Number(sub.metadata?.slotId)
  const customerId = Number(sub.metadata?.customerId)
  if (!status || !slotId || !customerId) return
  const payload = await payloadClient()
  // Only a paid period extends the banner (see paidUntilOf); the subscription comes fresh from syncSubscription.
  const paidUntil = paidUntilOf(sub)
  const existing = (await payload.find({ collection: 'banners', where: { stripeSubscriptionId: { equals: sub.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as
    | Banner
    | undefined
  const extend = (status === 'active' || status === 'canceling') && paidUntil ? { endAt: paidUntil } : {}

  if (existing) {
    await payload.update({ collection: 'banners', id: existing.id, data: { subscriptionStatus: status, ...extend }, overrideAccess: true })
    return
  }
  if (status !== 'active' || !paidUntil) return
  // Bought by two people at the same moment (both passed the check before paying): flag it to the team.
  const doubleBooked = await slotTaken(slotId)
  const banner = await payload.create({
    collection: 'banners',
    data: {
      advertiser: sub.metadata?.advertiser || 'Advertiser',
      linkUrl: sub.metadata?.linkUrl || absoluteUrl('/'),
      slots: [slotId],
      startAt: new Date().toISOString(),
      endAt: paidUntil,
      status: 'draft',
      owner: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: status,
    },
    overrideAccess: true,
  })
  // Created once, by whichever event comes first — so the welcome goes out here, not on checkout.session.completed.
  const [owner, slot] = await Promise.all([
    payload.findByID({ collection: 'customers', id: customerId, depth: 0, overrideAccess: true, disableErrors: true }),
    payload.findByID({ collection: 'ad-slots', id: slotId, depth: 0, disableErrors: true }),
  ])
  if (!owner?.email) return
  const mail = emailLayout({
    heading: 'Your banner place is booked',
    paragraphs: [
      `Thank you! ${slot?.name ?? 'The place'} is yours. It renews every month until you cancel.`,
      'Next step: upload the banner picture in your account. We check it, usually within a day, and it goes live.',
    ],
    button: { label: 'Upload the picture', href: absoluteUrl(`/account/ads/${banner.id}`) },
  })
  await sendMail({ to: owner.email, subject: `Banner place booked: ${slot?.name ?? ''}`, ...mail })
  await notifyTeam(
    payload,
    `${doubleBooked ? 'Check: place already taken — ' : ''}Banner place bought online: ${slot?.name ?? slotId}`,
    `/admin/collections/banners/${banner.id}`,
    owner,
  )
}

/** The buyer saves the banner: pictures (exact sizes, checked by the collection hook), name, link. Goes to review. */
export async function saveAd(customer: Customer, id: number, fd: FormData): Promise<CabinetResult> {
  const payload = await payloadClient()
  const banner = (await payload.findByID({ collection: 'banners', id, depth: 0, overrideAccess: true, disableErrors: true })) as Banner | null
  if (!banner || !isOwner(banner, customer)) return fail(404, 'Banner not found.')
  if (tooSoon(banner)) return fail(429, TOO_SOON_ERROR)
  const parsed = adSchema.safeParse(toFields(fd))
  if (!parsed.success) return fail(400, CHECK, zodErrors(parsed.error.issues))
  const changes: PhotoChange[] = []
  const take = async (field: 'imageDesktop' | 'imageMobile') => {
    const took = await takePhotos(payload, customer, fd, field, mediaIds(banner[field]), { max: 1, alt: `${parsed.data.advertiser} — banner` })
    if (took.ok) changes.push(took.change)
    return took
  }
  const desktop = await take('imageDesktop')
  if (!desktop.ok) return desktop.result
  const mobile = await take('imageMobile')
  if (!mobile.ok) {
    await settlePhotos(payload, customer, changes, false)
    return mobile.result
  }
  if (!desktop.change.ids[0]) {
    await settlePhotos(payload, customer, changes, false)
    return fail(400, CHECK, { imageDesktop: 'Add the banner picture' })
  }
  try {
    await payload.update({
      collection: 'banners',
      id,
      data: {
        advertiser: parsed.data.advertiser,
        linkUrl: parsed.data.linkUrl,
        imageDesktop: desktop.change.ids[0],
        imageMobile: mobile.change.ids[0] ?? null,
        status: 'pending',
        moderationNote: null,
      },
      overrideAccess: true,
    })
  } catch (e) {
    await settlePhotos(payload, customer, changes, false)
    return saveFailed(e, 'ads')
  }
  await settlePhotos(payload, customer, changes, true)
  await notifyTeam(payload, `Banner to review: ${parsed.data.advertiser}`, `/admin/collections/banners/${id}`, customer)
  return { ok: true, id, message: 'Sent for review. We usually check banners within a day — you will get an email when it is live.' }
}

/** The account's banners with their slot and lifetime impressions and clicks. */
export async function myAds(customerId: number) {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'banners',
    where: { owner: { equals: customerId } },
    sort: '-createdAt',
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })
  const ids = docs.map((b) => b.id)
  const totals: Record<number, { impressions: number; clicks: number }> = {}
  if (ids.length) {
    const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: { banner_id: number; i: string; c: string }[] }> } }
    const { rows } = await db.drizzle.execute(sql`
      SELECT "banner_id", coalesce(sum("impressions"), 0) AS i, coalesce(sum("clicks"), 0) AS c
      FROM "banner_stats" WHERE "banner_id" IN (${sql.join(
        ids.map((i) => sql`${i}`),
        sql`, `,
      )}) GROUP BY "banner_id"`)
    for (const r of rows) totals[Number(r.banner_id)] = { impressions: Number(r.i), clicks: Number(r.c) }
  }
  return docs.map((b) => ({ banner: b, stats: totals[b.id] ?? { impressions: 0, clicks: 0 } }))
}

/** One banner of the account, or null. */
export async function myAd(customer: Customer, id: number) {
  const payload = await payloadClient()
  const b = (await payload.findByID({ collection: 'banners', id, depth: 1, overrideAccess: true, disableErrors: true })) as Banner | null
  return b && relId(b.owner) === customer.id ? b : null
}
