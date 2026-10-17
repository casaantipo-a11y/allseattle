import { createHmac, timingSafeEqual } from 'node:crypto'

// Stripe over its REST API with fetch — no SDK, like Resend and Telegram
// (lib/notify.ts). Off while STRIPE_SECRET_KEY is empty. The API version is
// pinned so the shapes read in lib/billing.ts don't change under us; they're
// still read defensively (a few fields moved in 2025).

const API = 'https://api.stripe.com/v1'
const VERSION = '2025-03-31.basil'

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY)

/**
 * Stripe's Managed Payments (Stripe as merchant of record: it charges and remits US sales
 * tax, for an extra fee) is on by default for new accounts, and then a Checkout needs a
 * product tax code and refuses custom text. STRIPE_MANAGED_PAYMENTS=off turns it off for
 * our Checkouts (sales tax is then the client's business, or Stripe Tax); with it on,
 * STRIPE_TAX_CODE names the product tax code. Unset: the account's own default.
 */
export function managedPaymentsParams(): Record<string, unknown> {
  const mode = process.env.STRIPE_MANAGED_PAYMENTS?.trim().toLowerCase()
  if (mode === 'off') return { managed_payments: { enabled: false } }
  return {}
}
export const productTaxCode = () => process.env.STRIPE_TAX_CODE?.trim() || undefined

/**
 * Stripe Tax — the client's choice of 17.10.2026 ("Basic", 0.5% a transaction; the account
 * has its Washington registration): Checkout works out the sales tax from the buyer's
 * billing address and adds it on top of the price, as the note under the prices says; the
 * subscription keeps it on every renewal. On with STRIPE_AUTOMATIC_TAX=on (needs Managed
 * Payments off). The address is required so the city's local rate applies, and it is saved
 * on the Stripe customer we pass in.
 */
export function automaticTaxParams(): Record<string, unknown> {
  if (process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() !== 'on') return {}
  return { automatic_tax: { enabled: true }, billing_address_collection: 'required', customer_update: { address: 'auto', name: 'auto' } }
}

/** Our prices are before sales tax, which Stripe Tax adds on top. */
export const TAX_BEHAVIOR = 'exclusive'

/** A customer-portal configuration made for the site (cancel at period end, card, receipts);
 *  unset → the account's default, saved in the Dashboard. */
export const portalConfiguration = () => process.env.STRIPE_PORTAL_CONFIGURATION?.trim() || undefined

type Params = Record<string, unknown>

/** Stripe's form encoding: nested objects as a[b][c], arrays as a[0][b]. */
function encode(params: Params, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? encode(item as Params, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))))
    else if (typeof v === 'object') encode(v as Params, key, out)
    else out.append(key, String(v))
  }
  return out
}

export class StripeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function stripe<T = Record<string, unknown>>(method: 'GET' | 'POST', path: string, params: Params = {}, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new StripeError('Stripe is not configured', 503)
  const body = encode(params)
  const url = method === 'GET' && [...body].length ? `${API}${path}?${body}` : `${API}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': VERSION,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: method === 'POST' ? body : undefined,
    signal: AbortSignal.timeout(15000),
  })
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  if (!res.ok) throw new StripeError(json.error?.message ?? `Stripe ${res.status}`, res.status)
  return json as T
}

export type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } }

/**
 * Checks a webhook's `Stripe-Signature` (HMAC-SHA256 of "timestamp.body" with the
 * endpoint's signing secret, within 5 minutes) and returns the event, or null.
 * The body must be the raw text, exactly as received.
 */
export function verifyWebhook(rawBody: string, header: string | null, secret: string, now = Date.now()): StripeEvent | null {
  if (!header) return null
  const parts = header.split(',').map((p) => p.split('=') as [string, string])
  const t = parts.find(([k]) => k === 't')?.[1]
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!t || !sigs.length || Math.abs(now / 1000 - Number(t)) > 300) return null
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest()
  const ok = sigs.some((s) => {
    const got = Buffer.from(s, 'hex')
    return got.length === expected.length && timingSafeEqual(got, expected)
  })
  if (!ok) return null
  try {
    return JSON.parse(rawBody) as StripeEvent
  } catch {
    return null
  }
}
