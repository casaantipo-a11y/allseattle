import { HONEYPOT } from '@/lib/forms'
import { customerFrom, saveListing, type Kind } from '@/lib/listings'

// POST /api/account/listings — a site customer sends a new car or job (multipart,
// `kind` = car | job). It goes to the team as Pending review; see lib/listings.ts.

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return json({ error: 'Please log in first.' }, 401)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form. Photos may be too large.' }, 400)
  }
  if (typeof fd.get(HONEYPOT) === 'string' && (fd.get(HONEYPOT) as string).trim() !== '') return json({ ok: true, id: 0 })
  const kind = fd.get('kind')
  if (kind !== 'car' && kind !== 'job') return json({ error: 'Unknown listing type.' }, 400)
  const r = await saveListing(customer, kind as Kind, fd)
  return r.ok ? json(r) : json({ error: r.error, fieldErrors: r.fieldErrors }, r.status)
}
