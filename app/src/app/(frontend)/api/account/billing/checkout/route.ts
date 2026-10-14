import { startPackageCheckout } from '@/lib/billing'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/billing/checkout {businessId, packageId, consent} — starts Stripe
// Checkout for a package and answers with its URL (lib/billing.ts).

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return Response.json({ error: 'Please log in first.' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { businessId?: unknown; packageId?: unknown; consent?: unknown }
  const r = await startPackageCheckout(customer, Number(b.businessId), Number(b.packageId), b.consent === true)
  return r.ok ? Response.json(r) : Response.json({ error: r.error, fieldErrors: r.fieldErrors }, { status: r.status })
}
