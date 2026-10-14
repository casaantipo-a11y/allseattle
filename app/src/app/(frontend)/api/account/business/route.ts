import { saveBusiness } from '@/lib/business-cabinet'
import { customerFrom } from '@/lib/cabinet'
import { HONEYPOT } from '@/lib/forms'

// POST /api/account/business — a site customer registers a business (multipart).
// It waits for the team as Pending review; see lib/business-cabinet.ts.

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
  const r = await saveBusiness(customer, fd)
  return r.ok ? json(r) : json({ error: r.error, fieldErrors: r.fieldErrors }, r.status)
}
