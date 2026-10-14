import { startAdCheckout } from '@/lib/ad-billing'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/ads/checkout (form: slot, advertiser, linkUrl, consent=yes) —
// Stripe Checkout for a banner place; answers with its URL (lib/ad-billing.ts).

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return Response.json({ error: 'Please log in first.' }, { status: 401 })
  const fd = await req.formData().catch(() => null)
  if (!fd) return Response.json({ error: 'Could not read the form.' }, { status: 400 })
  const r = await startAdCheckout(customer, fd)
  return r.ok ? Response.json(r) : Response.json({ error: r.error, fieldErrors: r.fieldErrors }, { status: r.status })
}
