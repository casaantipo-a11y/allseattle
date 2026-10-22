import type { Business, Customer, Package } from '@/payload-types'

import { CHECK, fail, isOwner, notifyTeam, payloadClient, relId, type CabinetResult } from './cabinet'
import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'
import { syncAdSubscription } from './ad-billing'
import { automaticTaxParams, managedPaymentsParams, portalConfiguration, productTaxCode, stripe, stripeEnabled, StripeError, TAX_BEHAVIOR, type StripeEvent } from './stripe'

// Stage 3, step 4: package subscriptions through Stripe (ad places, step 5, are in
// lib/ad-billing.ts and share the webhook: their subscriptions carry kind=banner). The owner picks a
// package in the account and pays in Stripe Checkout (monthly, renews until
// cancelled); the webhook (/api/stripe/webhook) then sets the business's
// package and moves packageExpiresAt to the end of the paid month. Cancelling
// (Stripe's billing portal) stops renewal; the package runs out by itself on
// packageExpiresAt, the same rule as a package the team sets by hand.
// Prices come from the Packages collection (priceMonthly); 0 means "contact us".

/** Extra time after a paid period ends, so a renewal webhook that arrives late doesn't drop the package. */
export const GRACE_MS = 24 * 3600 * 1000
export const LIVE = ['active', 'canceling', 'past_due'] as const

export const NOT_SET_UP = 'Online payment is not available yet. Please contact us to get a package.'

export type Sub = {
  id: string
  status: string
  cancel_at_period_end?: boolean
  current_period_end?: number
  items?: { data?: { current_period_end?: number }[] }
  metadata?: Record<string, string>
  customer?: string
  latest_invoice?: string | { status?: string } | null
}

/**
 * The subscription as Stripe has it now, with its latest invoice. Events can arrive out
 * of order and Stripe moves a subscription to its next period (subscription.updated)
 * before it tries to charge for it, so the event's own copy is not trusted.
 */
export const freshSubscription = (id: string) => stripe<Sub>('GET', `/subscriptions/${id}`, { expand: ['latest_invoice'] })

/** The end of the period that is actually paid (+ grace), or null when the latest invoice
 *  isn't paid yet — a new period must not extend anything before its money arrives. */
export function paidUntilOf(sub: Sub): string | null {
  const paid = typeof sub.latest_invoice === 'object' && sub.latest_invoice?.status === 'paid'
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end
  return paid && periodEnd ? new Date(periodEnd * 1000 + GRACE_MS).toISOString() : null
}

const hasLiveSubscription = (biz: Business) => Boolean(biz.subscriptionStatus && (LIVE as readonly string[]).includes(biz.subscriptionStatus))

export async function stripeCustomerFor(customer: Customer) {
  if (customer.stripeCustomerId) return customer.stripeCustomerId
  const c = await stripe<{ id: string }>(
    'POST',
    '/customers',
    { email: customer.email, name: customer.name, phone: customer.phone ?? undefined, preferred_locales: ['en'], metadata: { customerId: customer.id } },
    `customer-${customer.id}`,
  )
  const payload = await payloadClient()
  await payload.update({ collection: 'customers', id: customer.id, data: { stripeCustomerId: c.id }, overrideAccess: true })
  return c.id
}

/** Stripe Checkout for a package of one of the account's businesses. */
export async function startPackageCheckout(customer: Customer, bizId: number, packageId: number, consent: boolean): Promise<CabinetResult & { url?: string }> {
  if (!stripeEnabled()) return fail(503, NOT_SET_UP)
  const payload = await payloadClient()
  const biz = (await payload.findByID({ collection: 'businesses', id: bizId, depth: 0, overrideAccess: true, disableErrors: true })) as Business | null
  if (!biz || !isOwner(biz, customer)) return fail(404, 'Business not found.')
  if (biz.status === 'rejected') return fail(400, 'This business was not approved. Edit it and send it for review first.')
  if (hasLiveSubscription(biz)) return fail(400, 'This business already has a subscription. Use “Manage billing” to change or cancel it.')
  const pkg = (await payload.findByID({ collection: 'packages', id: packageId, depth: 0, disableErrors: true })) as Package | null
  if (!pkg) return fail(400, CHECK, { package: 'Choose a package' })
  if (!(pkg.priceMonthly > 0)) return fail(400, `The ${pkg.name} package is arranged with our team — please contact us.`)
  if (!consent) return fail(400, CHECK, { consent: 'Please confirm the monthly payment' })

  const meta = { businessId: biz.id, packageId: pkg.id, customerId: customer.id }
  try {
    const session = await stripe<{ url: string }>('POST', '/checkout/sessions', {
      mode: 'subscription',
      // English like the site (client, 22.10.2026: a Russian browser got Stripe's page in Russian).
      locale: 'en',
      ...managedPaymentsParams(),
      ...automaticTaxParams(),
      customer: await stripeCustomerFor(customer),
      client_reference_id: biz.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (pkg.currency ?? 'USD').toLowerCase(),
            unit_amount: Math.round(pkg.priceMonthly * 100),
            recurring: { interval: 'month' },
            tax_behavior: TAX_BEHAVIOR,
            product_data: { name: `AllSeattle ${pkg.name} package`, tax_code: productTaxCode(), metadata: { packageId: pkg.id } },
          },
        },
      ],
      subscription_data: { description: `${pkg.name} package for ${biz.name}`, metadata: meta },
      metadata: meta,
      // No custom_text: Stripe's Managed Payments (on by default for new accounts) rejects it.
      // The monthly-charge consent is the checkbox on our page before this step.
      success_url: absoluteUrl(`/account/business/${biz.id}/package?paid=1`),
      cancel_url: absoluteUrl(`/account/business/${biz.id}/package`),
    })
    return { ok: true, id: biz.id, message: 'Redirecting to payment…', url: session.url }
  } catch (e) {
    console.error('[billing] checkout failed', e)
    return fail(502, e instanceof StripeError && e.status < 500 ? `Payment could not start: ${e.message}` : 'Payment could not start. Please try again in a minute.')
  }
}

/** Stripe's billing portal for the account: cancel, change the card, download receipts. */
export async function openBillingPortal(customer: Customer, returnPath: string): Promise<CabinetResult & { url?: string }> {
  if (!stripeEnabled()) return fail(503, NOT_SET_UP)
  if (!customer.stripeCustomerId) return fail(400, 'There is no online payment on this account yet.')
  try {
    const s = await stripe<{ url: string }>('POST', '/billing_portal/sessions', {
      customer: customer.stripeCustomerId,
      configuration: portalConfiguration(),
      locale: 'en',
      return_url: absoluteUrl(returnPath),
    })
    return { ok: true, id: customer.id, message: 'Opening billing…', url: s.url }
  } catch (e) {
    console.error('[billing] portal failed', e)
    return fail(502, 'Billing could not open. Please try again in a minute.')
  }
}

export const statusOf = (s: Sub): Business['subscriptionStatus'] | null => {
  if (s.status === 'active' || s.status === 'trialing') return s.cancel_at_period_end ? 'canceling' : 'active'
  if (s.status === 'past_due' || s.status === 'unpaid') return 'past_due'
  if (s.status === 'canceled' || s.status === 'incomplete_expired') return 'canceled'
  return null // incomplete: nothing paid yet
}

/** Brings a business (or, for kind=banner, a banner) in line with its Stripe subscription. Safe to run any number of times. */
export async function syncSubscription(subOrId: Sub | string, opts: { welcome?: boolean } = {}) {
  const sub = await freshSubscription(typeof subOrId === 'string' ? subOrId : subOrId.id)
  if (sub.metadata?.kind === 'banner') return syncAdSubscription(sub, opts)
  const bizId = Number(sub.metadata?.businessId)
  const packageId = Number(sub.metadata?.packageId)
  const status = statusOf(sub)
  if (!bizId || !packageId || !status) return
  const payload = await payloadClient()
  const biz = (await payload.findByID({ collection: 'businesses', id: bizId, depth: 0, overrideAccess: true, disableErrors: true })) as Business | null
  if (!biz) return console.error('[billing] subscription for a missing business', sub.id, bizId)
  // A newer subscription replaced this one: don't let the old one's events overwrite it.
  if (biz.stripeSubscriptionId && biz.stripeSubscriptionId !== sub.id && hasLiveSubscription(biz) && status === 'canceled') return
  // Two checkouts paid for one business (two tabs): both subscriptions charge. Tell the team to refund one.
  if (opts.welcome && biz.stripeSubscriptionId && biz.stripeSubscriptionId !== sub.id && hasLiveSubscription(biz)) {
    const owner = await payload.findByID({ collection: 'customers', id: Number(sub.metadata?.customerId), depth: 0, overrideAccess: true, disableErrors: true })
    if (owner) await notifyTeam(payload, `Check Stripe: a second package subscription for ${biz.name} (${biz.stripeSubscriptionId} and ${sub.id})`, `/admin/collections/businesses/${biz.id}`, owner)
  }

  const paidUntil = paidUntilOf(sub)
  const data: Partial<Business> = { stripeSubscriptionId: sub.id, subscriptionStatus: status }
  // Active (also when cancelled for the period's end): the package runs to the end of the
  // period that is paid. A period whose invoice isn't paid yet (or failed: past due) keeps
  // the date it had — Stripe retries, and invoice.paid moves it on.
  if (status === 'active' || status === 'canceling') Object.assign(data, { package: packageId, ...(paidUntil ? { packageExpiresAt: paidUntil } : {}) })
  await payload.update({ collection: 'businesses', id: bizId, data, overrideAccess: true, context: { skipGeocode: true } })

  if (opts.welcome && status === 'active') {
    const [owner, pkg] = await Promise.all([
      biz.owner ? payload.findByID({ collection: 'customers', id: relId(biz.owner)!, depth: 0, overrideAccess: true, disableErrors: true }) : null,
      payload.findByID({ collection: 'packages', id: packageId, depth: 0, disableErrors: true }),
    ])
    if (owner?.email && pkg) {
      const mail = emailLayout({
        heading: `${pkg.name} package is on`,
        paragraphs: [
          `Thank you! “${biz.name}” now has the ${pkg.name} package. It renews every month until you cancel.`,
          'Stripe emails the receipt. You can cancel or change the card any time from your account.',
        ],
        button: { label: 'Open my business', href: absoluteUrl('/account/business') },
      })
      await sendMail({ to: owner.email, subject: `${pkg.name} package for ${biz.name}`, ...mail })
      await notifyTeam(payload, `Package bought online: ${pkg.name} for ${biz.name}`, `/admin/collections/businesses/${biz.id}`, owner)
    }
  }
}

const subIdOf = (o: Record<string, unknown>): string | null => {
  const direct = o.subscription
  if (typeof direct === 'string') return direct
  const parent = o.parent as { subscription_details?: { subscription?: string } } | undefined
  return parent?.subscription_details?.subscription ?? null
}

/** The webhook's work, per event type. Unknown events are ignored. */
export async function handleStripeEvent(event: StripeEvent) {
  const o = event.data.object
  switch (event.type) {
    case 'checkout.session.completed': {
      if (o.mode !== 'subscription' || o.payment_status === 'unpaid') return
      const id = subIdOf(o)
      if (id) await syncSubscription(id, { welcome: true })
      return
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const id = subIdOf(o)
      if (id) await syncSubscription(id)
      return
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(o as unknown as Sub)
      return
  }
}
