import { handleStripeEvent } from '@/lib/billing'
import { verifyWebhook } from '@/lib/stripe'

// POST /api/stripe/webhook — Stripe's events for package subscriptions
// (lib/billing.ts). The signature is checked against STRIPE_WEBHOOK_SECRET on the
// raw body; a failure while handling answers 500 so Stripe retries the event.
// In the Stripe dashboard, send: checkout.session.completed, invoice.paid,
// invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted.

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('Stripe webhook is not configured', { status: 503 })
  const raw = await req.text()
  const event = verifyWebhook(raw, req.headers.get('stripe-signature'), secret)
  if (!event) return new Response('Bad signature', { status: 400 })
  try {
    await handleStripeEvent(event)
  } catch (e) {
    console.error('[stripe] webhook failed', event.type, event.id, e)
    return new Response('Handler failed', { status: 500 })
  }
  return Response.json({ received: true })
}
