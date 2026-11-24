import { randomBytes } from 'node:crypto'

import { z } from 'zod'

import type { Business, Package } from '@/payload-types'

import { hasLiveSubscription, NOT_SET_UP, packageSessionParams } from './billing'
import { fail, payloadClient, teamReplyTo, type CabinetResult } from './cabinet'
import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'
import { stripe, stripeEnabled, StripeError } from './stripe'

// "Send payment link" (admin → Businesses → Package): the team mails a client a link to Stripe
// Checkout for a package, so a business without a site account can pay. The link is /pay/<token>.
// Every send makes a NEW token (the previous mail's link stops working) and records the package and
// the price the client was shown; a visit opens a fresh Checkout Session (a Stripe session lives
// 24 hours, the link in the mail must keep working) as long as the link is younger than LINK_TTL_DAYS,
// the package still costs what the mail said, and the business has not ended a subscription bought
// with it. The webhook does the rest: lib/billing.ts treats a subscription with metadata via=link
// like any other.

const emailSchema = z.email()

export const newToken = () => randomBytes(24).toString('base64url')

/** How long a link works after it is sent. */
export const LINK_TTL_DAYS = 30
/** Sending again to the same business is refused for this long. */
export const RESEND_GAP_MS = 60 * 1000
/** Links sent in the last hour, all businesses together — a sales account can't spam mail from our sender. */
export const HOURLY_CAP = 30

const noControl = (s: string) => s.replace(/\p{Cc}+/gu, ' ').trim() // control characters (and so line breaks) out of a mail subject

/** $99 for a whole dollar amount, $49.50 otherwise, in the package's currency. */
export function priceText(pkg: Package) {
  const whole = Number.isInteger(pkg.priceMonthly)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: pkg.currency ?? 'USD', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(pkg.priceMonthly)
}

/** The mail the client gets. */
function linkMail(biz: Business, pkg: Package, token: string) {
  const features = (pkg.features ?? []).map((f) => f.text).filter(Boolean)
  return emailLayout({
    heading: `Your AllSeattle ${pkg.name} package`,
    paragraphs: [
      `Business: ${biz.name}`,
      `Package: ${pkg.name}`,
      ...(features.length ? [`Includes: ${features.join('; ')}.`] : []),
      `Price: ${priceText(pkg)}/month${process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === 'on' ? ' plus sales tax' : ''}. It renews monthly, cancel any time.`,
    ],
    button: { label: 'Pay securely', href: absoluteUrl(`/pay/${token}`) },
    after: ['The payment is handled by Stripe — the card details never reach AllSeattle. Questions? Just reply to this email.'],
  })
}

/** Resend answered with an error status: the mail was certainly not sent (a timeout or a dropped connection says nothing). */
const refused = (e: unknown) => e instanceof Error && /^Resend \d{3}/.test(e.message)

/** Makes a new link for the business, saves who it went to and what it costs, and sends the mail. */
export async function sendPaymentLink(input: { businessId: number; packageId: number; email: string }): Promise<CabinetResult & { sentTo?: string; sentAt?: string }> {
  if (!stripeEnabled()) return fail(503, NOT_SET_UP)
  const email = emailSchema.safeParse(input.email.trim())
  if (!email.success) return fail(400, 'Enter a valid email address.', { email: 'Enter a valid email address.' })
  const payload = await payloadClient()
  const biz = (await payload.findByID({ collection: 'businesses', id: input.businessId, depth: 0, overrideAccess: true, disableErrors: true })) as Business | null
  if (!biz) return fail(404, 'Business not found.')
  if (biz.status === 'rejected') return fail(400, 'This business was not approved.')
  if (hasLiveSubscription(biz)) return fail(400, 'This business already has a subscription.')
  const pkg = (await payload.findByID({ collection: 'packages', id: input.packageId, depth: 0, overrideAccess: true, disableErrors: true })) as Package | null
  if (!pkg) return fail(400, 'Choose a package.')
  if (!(pkg.priceMonthly > 0)) return fail(400, `The ${pkg.name} package has no monthly price, so it can't be paid online.`)

  if (biz.paymentLinkSentAt && Date.now() - new Date(biz.paymentLinkSentAt).getTime() < RESEND_GAP_MS) return fail(429, 'A link was sent to this business a moment ago. Please wait a minute before sending another.')
  const lastHour = await payload.count({ collection: 'businesses', where: { paymentLinkSentAt: { greater_than: new Date(Date.now() - 3600 * 1000).toISOString() } }, overrideAccess: true })
  if (lastHour.totalDocs >= HOURLY_CAP) return fail(429, 'Too many payment links were sent in the last hour. Please try again later.')

  const before = {
    paymentLinkToken: biz.paymentLinkToken ?? null,
    paymentLinkPackage: typeof biz.paymentLinkPackage === 'object' ? (biz.paymentLinkPackage?.id ?? null) : (biz.paymentLinkPackage ?? null),
    paymentLinkPrice: biz.paymentLinkPrice ?? null,
    paymentLinkSentTo: biz.paymentLinkSentTo ?? null,
    paymentLinkSentAt: biz.paymentLinkSentAt ?? null,
  }
  const token = newToken()
  const sentAt = new Date().toISOString()
  const save = (data: Partial<Business>) => payload.update({ collection: 'businesses', id: biz.id, data, overrideAccess: true, context: { skipGeocode: true } })
  let mailTried = false
  try {
    // Saved first: /pay/<token> reads the package, the price and the email from here.
    await save({ paymentLinkToken: token, paymentLinkPackage: pkg.id, paymentLinkPrice: pkg.priceMonthly, paymentLinkSentTo: email.data, paymentLinkSentAt: sentAt })
    mailTried = true
    await sendMail({ to: email.data, subject: noControl(`Your AllSeattle ${pkg.name} package for ${biz.name}`), ...linkMail(biz, pkg, token), replyTo: await teamReplyTo(payload) })
  } catch (e) {
    console.error('[payment-link] could not send', e)
    if (mailTried && !refused(e)) {
      // A timeout can come after the mail was handed over: keep the link alive, say so.
      return fail(502, 'The email service did not answer, so the link may or may not have gone out. Check with the client before sending another.')
    }
    // Certainly not sent: the record must not say "sent".
    await save(before).catch((err) => console.error('[payment-link] could not restore', err))
    return fail(502, 'The email could not be sent. Please try again in a minute.')
  }
  return { ok: true, id: biz.id, message: `Payment link sent to ${email.data}.`, sentTo: email.data, sentAt }
}

/** A fresh Checkout Session for the link's business and package, or why there is none. */
export async function checkoutForLink(token: string): Promise<{ kind: 'invalid' } | { kind: 'paid' } | { kind: 'error' } | { kind: 'ok'; url: string }> {
  // Tokens are base64url (newToken); anything else, a NUL included, can't be one and must not reach the database.
  if (!token || token.length > 100 || !/^[\w-]+$/.test(token)) return { kind: 'invalid' }
  if (!stripeEnabled()) return { kind: 'error' }
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'businesses', where: { paymentLinkToken: { equals: token } }, limit: 1, depth: 1, overrideAccess: true })
  const biz = docs[0] as Business | undefined
  const pkg = biz && typeof biz.paymentLinkPackage === 'object' ? (biz.paymentLinkPackage as Package | null) : null
  if (!biz || !pkg || !biz.paymentLinkSentTo || biz.status === 'rejected') return { kind: 'invalid' }
  if (hasLiveSubscription(biz)) return { kind: 'paid' }
  const age = biz.paymentLinkSentAt ? Date.now() - new Date(biz.paymentLinkSentAt).getTime() : Infinity
  if (age > LINK_TTL_DAYS * 86400 * 1000) return { kind: 'invalid' }
  if (!(pkg.priceMonthly > 0)) return { kind: 'invalid' }
  // The mail named a price: a package that costs something else now needs a new mail.
  if (biz.paymentLinkPrice != null && Number(biz.paymentLinkPrice) !== pkg.priceMonthly) return { kind: 'invalid' }
  try {
    const session = await stripe<{ url: string }>(
      'POST',
      '/checkout/sessions',
      packageSessionParams(biz, pkg, { customer_email: biz.paymentLinkSentTo }, { businessId: biz.id, packageId: pkg.id, via: 'link' }, { success: '/pay/thanks', cancel: '/' }),
    )
    return { kind: 'ok', url: session.url }
  } catch (e) {
    console.error('[payment-link] checkout failed', e instanceof StripeError ? e.message : e)
    return { kind: 'error' }
  }
}
