import { customerFrom, listingAction, type ListingAction } from '@/lib/listings'

// POST /api/account/listings/:kind/:id/action {action: hide | show | renew | delete}
// — the buttons on /account/listings.

const ACTIONS: ListingAction[] = ['hide', 'show', 'renew', 'delete']
const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if ((kind !== 'car' && kind !== 'job') || !/^\d+$/.test(id)) return json({ error: 'Listing not found.' }, 404)
  const customer = await customerFrom(req)
  if (!customer) return json({ error: 'Please log in first.' }, 401)
  const body = (await req.json().catch(() => ({}))) as { action?: string }
  const action = ACTIONS.find((a) => a === body.action)
  if (!action) return json({ error: 'Unknown action.' }, 400)
  const r = await listingAction(customer, kind, Number(id), action)
  return r.ok ? json(r) : json({ error: r.error }, r.status)
}
