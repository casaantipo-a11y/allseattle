import { openBillingPortal } from '@/lib/billing'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/billing/portal {returnPath} — Stripe's billing portal (cancel,
// card, receipts) for the signed-in account; answers with its URL.

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return Response.json({ error: 'Please log in first.' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { returnPath?: unknown }
  const path = typeof b.returnPath === 'string' && /^\/account(\/[\w/-]*)?$/.test(b.returnPath) ? b.returnPath : '/account/business'
  const r = await openBillingPortal(customer, path)
  return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: r.status })
}
