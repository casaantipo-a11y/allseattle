import { randomBytes } from 'node:crypto'

import { z } from 'zod'

import type { Business, Package } from '@/payload-types'

import { hasLiveSubscription, NOT_SET_UP, packageSessionParams } from './billing'
import { fail, payloadClient, teamReplyTo, type CabinetResult } from './cabinet'
import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'
import { stripe, stripeEnabled, StripeError } from './stripe'

// "Send payment link" (admin → Businesses → Package): the team mails a client a link to Stripe
// Checkout for a package, so a business without a site account can pay. The link is /pay/<token>;
// the token is made once and kept, and every visit opens a fresh Checkout Session (a Stripe
// session lives 24 hours, the link in the mail must keep working). The webhook does the rest:
// lib/billing.ts treats a subscription with metadata via=link like any other.

const emailSchema = z.email()

export const newToken = () => randomBytes(24).toString('base64url')

/** The mail the client gets. */
function linkMail(biz: Business, pkg: Package, token: string) {
  const features = (pkg.features ?? []).map((f) => f.text).filter(Boolean)
  const price = `$${pkg.priceMonthly.toLocaleString('en-US', { maximumFractionDigits: 2 })}/month`
  return emailLayout({
    heading: `Your AllSeattle ${pkg.name} package`,
    paragraphs: [
      `Business: ${biz.name}`,
      `Package: ${pkg.name}`,
      ...(features.length ? [`Includes: ${features.join('; ')}.`] : []),
      `Price: ${price}${process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === 'on' ? ' plus sales tax' : ''}. It renews monthly, cancel any time.`,
    ],
    button: { label: 'Pay securely', href: absoluteUrl(`/pay/${token}`) },
    after: ['The payment is handled by Stripe — the card details never reach AllSeattle. Questions? Just reply to this email.'],
  })
}

/** Makes (or reuses) the business's link, saves who it went to, and sends the mail. */
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

  const before = {
    paymentLinkToken: biz.paymentLinkToken ?? null,
    paymentLinkPackage: typeof biz.paymentLinkPackage === 'object' ? (biz.paymentLinkPackage?.id ?? null) : (biz.paymentLinkPackage ?? null),
    paymentLinkSentTo: biz.paymentLinkSentTo ?? null,
    paymentLinkSentAt: biz.paymentLinkSentAt ?? null,
  }
  const token = biz.paymentLinkToken || newToken()
  const sentAt = new Date().toISOString()
  const save = (data: Partial<Business>) => payload.update({ collection: 'businesses', id: biz.id, data, overrideAccess: true, context: { skipGeocode: true } })
  try {
    // Saved first: /pay/<token> reads the package and the email from here.
    await save({ paymentLinkToken: token, paymentLinkPackage: pkg.id, paymentLinkSentTo: email.data, paymentLinkSentAt: sentAt })
    await sendMail({ to: email.data, subject: `Your AllSeattle ${pkg.name} package for ${biz.name}`, ...linkMail(biz, pkg, token), replyTo: await teamReplyTo(payload) })
  } catch (e) {
    console.error('[payment-link] could not send', e)
    // The record must not say "sent" when it wasn't.
    await save(before).catch((err) => console.error('[payment-link] could not restore', err))
    return fail(502, 'The email could not be sent. Please try again in a minute.')
  }
  return { ok: true, id: biz.id, message: `Payment link sent to ${email.data}.`, sentTo: email.data, sentAt }
}

/** A fresh Checkout Session for the link's business and package, or why there is none. */
export async function checkoutForLink(token: string): Promise<{ kind: 'invalid' } | { kind: 'paid' } | { kind: 'error' } | { kind: 'ok'; url: string }> {
  if (!token || token.length > 100) return { kind: 'invalid' }
  if (!stripeEnabled()) return { kind: 'error' }
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'businesses', where: { paymentLinkToken: { equals: token } }, limit: 1, depth: 1, overrideAccess: true })
  const biz = docs[0] as Business | undefined
  const pkg = biz && typeof biz.paymentLinkPackage === 'object' ? (biz.paymentLinkPackage as Package | null) : null
  if (!biz || !pkg || !biz.paymentLinkSentTo || biz.status === 'rejected') return { kind: 'invalid' }
  if (hasLiveSubscription(biz)) return { kind: 'paid' }
  if (!(pkg.priceMonthly > 0)) return { kind: 'invalid' }
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
