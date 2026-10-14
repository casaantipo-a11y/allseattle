import type { Business, Customer } from '@/payload-types'

import { CHECK, fail, mediaIds, notifyTeam, payloadClient, settlePhotos, type CabinetResult } from './cabinet'
import { emailLayout, sendMail } from './email'

// "Delete my account" (stage 3). The account owner confirms with the password.
// Refused while a subscription still renews — Stripe would go on charging an
// account that no longer exists — so they cancel in "Manage billing" first.
// What goes with the account: its cars and jobs (with their photos) and any
// business that never went live (with its promotions and products). What stays,
// without an owner, for the team to decide: published businesses and banners —
// they may be paid for, and a cancelled subscription still runs to its paid end.
// Contest votes are not tied to accounts and stay.

const RENEWING = ['active', 'past_due']

export async function deleteAccount(customer: Customer, password: string): Promise<CabinetResult> {
  const payload = await payloadClient()
  if (!password) return fail(400, CHECK, { password: 'Enter your password' })
  try {
    await payload.login({ collection: 'customers', data: { email: customer.email, password } })
  } catch {
    return fail(400, CHECK, { password: 'Wrong password' })
  }

  const owned = { owner: { equals: customer.id } }
  const [businesses, banners] = await Promise.all([
    payload.find({ collection: 'businesses', where: owned, depth: 0, limit: 100, overrideAccess: true }),
    payload.find({ collection: 'banners', where: owned, depth: 0, limit: 100, overrideAccess: true }),
  ])
  const renewing = [...businesses.docs, ...banners.docs].some((d) => d.subscriptionStatus && RENEWING.includes(d.subscriptionStatus))
  if (renewing) {
    return fail(400, 'You still have a subscription that renews every month. Cancel it in “Manage billing” first (what you paid for stays until its end), then delete the account.')
  }

  try {
    // Cars and jobs, with the photos uploaded from this account.
    for (const collection of ['car-listings', 'jobs'] as const) {
      const { docs } = await payload.find({ collection, where: owned, depth: 0, limit: 500, overrideAccess: true })
      for (const doc of docs) {
        await payload.delete({ collection, id: doc.id, overrideAccess: true })
        if (collection === 'car-listings') await settlePhotos(payload, customer, [{ ids: [], added: [], removed: mediaIds((doc as { photos?: unknown }).photos) }], true)
      }
    }
    // Businesses: never live → deleted with their promotions and products; live → kept, owner cleared.
    for (const biz of businesses.docs as Business[]) {
      if (biz.status === 'published') {
        await payload.update({ collection: 'businesses', id: biz.id, data: { owner: null }, overrideAccess: true, context: { skipGeocode: true } })
        continue
      }
      for (const collection of ['promotions', 'products'] as const) {
        const { docs } = await payload.find({ collection, where: { business: { equals: biz.id } }, depth: 0, limit: 1000, overrideAccess: true })
        for (const item of docs) await payload.delete({ collection, id: item.id, overrideAccess: true })
        await settlePhotos(payload, customer, [{ ids: [], added: [], removed: docs.flatMap((d) => mediaIds(d.image)) }], true)
      }
      await payload.delete({ collection: 'businesses', id: biz.id, overrideAccess: true })
      await settlePhotos(payload, customer, [{ ids: [], added: [], removed: [...mediaIds(biz.logo), ...mediaIds(biz.cover), ...mediaIds(biz.gallery)] }], true)
    }
    // Banners stay (paid places run to their end); the team sees them without an owner.
    for (const b of banners.docs) await payload.update({ collection: 'banners', id: b.id, data: { owner: null }, overrideAccess: true })

    await payload.delete({ collection: 'customers', id: customer.id, overrideAccess: true })
  } catch (e) {
    console.error('[account] delete failed', e)
    return fail(500, 'Something went wrong on our side. Please try again in a minute, or write to us.')
  }

  const kept = businesses.docs.filter((b) => b.status === 'published').length + banners.docs.length
  await notifyTeam(
    payload,
    `Account deleted by its owner: ${customer.email}${kept ? ` — ${kept} business(es)/banner(s) kept without an owner` : ''}`,
    '/admin/collections/customers',
    customer,
  )
  const mail = emailLayout({
    heading: 'Your account is deleted',
    paragraphs: [
      'Your AllSeattle account and your car and job listings have been deleted.',
      kept
        ? 'Published businesses and paid banners stay on the site until we sort them out. Write to us if you want them removed too.'
        : 'If you did not ask for this, write to us right away.',
    ],
  })
  await sendMail({ to: customer.email, subject: 'Your AllSeattle account is deleted', ...mail })
  return { ok: true, id: customer.id, message: 'Your account is deleted.' }
}
