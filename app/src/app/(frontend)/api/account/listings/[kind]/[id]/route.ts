import { customerFrom, saveListing } from '@/lib/listings'

// POST /api/account/listings/:kind/:id — the author edits their car or job. Any
// edit sends it back to Pending review.

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if ((kind !== 'car' && kind !== 'job') || !/^\d+$/.test(id)) return json({ error: 'Listing not found.' }, 404)
  const customer = await customerFrom(req)
  if (!customer) return json({ error: 'Please log in first.' }, 401)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form. Photos may be too large.' }, 400)
  }
  const r = await saveListing(customer, kind, fd, Number(id))
  return r.ok ? json(r) : json({ error: r.error, fieldErrors: r.fieldErrors }, r.status)
}
