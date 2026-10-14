import { saveItem } from '@/lib/business-cabinet'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/business/:id/items — the owner adds a promotion or a product
// (multipart, `kind` = promotion | product). Live at once; the package decides
// whether it's allowed.

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return json({ error: 'Business not found.' }, 404)
  const customer = await customerFrom(req)
  if (!customer) return json({ error: 'Please log in first.' }, 401)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form. The picture may be too large.' }, 400)
  }
  const kind = fd.get('kind')
  if (kind !== 'promotion' && kind !== 'product') return json({ error: 'Unknown item type.' }, 400)
  const r = await saveItem(customer, Number(id), kind, fd)
  return r.ok ? json(r) : json({ error: r.error, fieldErrors: r.fieldErrors }, r.status)
}
