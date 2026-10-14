import { deleteItem, saveItem } from '@/lib/business-cabinet'
import { customerFrom } from '@/lib/cabinet'

// POST (edit) and DELETE /api/account/business/:id/items/:kind/:itemId — a
// promotion or product of the owner's business.

type Ctx = { params: Promise<{ id: string; kind: string; itemId: string }> }
const json = (body: unknown, status = 200) => Response.json(body, { status })

async function target(req: Request, ctx: Ctx) {
  const { id, kind, itemId } = await ctx.params
  if ((kind !== 'promotion' && kind !== 'product') || !/^\d+$/.test(id) || !/^\d+$/.test(itemId)) return null
  const customer = await customerFrom(req)
  return { customer, bizId: Number(id), kind: kind as 'promotion' | 'product', itemId: Number(itemId) }
}

export async function POST(req: Request, ctx: Ctx) {
  const t = await target(req, ctx)
  if (!t) return json({ error: 'Not found.' }, 404)
  if (!t.customer) return json({ error: 'Please log in first.' }, 401)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form. The picture may be too large.' }, 400)
  }
  const r = await saveItem(t.customer, t.bizId, t.kind, fd, t.itemId)
  return r.ok ? json(r) : json({ error: r.error, fieldErrors: r.fieldErrors }, r.status)
}

export async function DELETE(req: Request, ctx: Ctx) {
  const t = await target(req, ctx)
  if (!t) return json({ error: 'Not found.' }, 404)
  if (!t.customer) return json({ error: 'Please log in first.' }, 401)
  const r = await deleteItem(t.customer, t.bizId, t.kind, t.itemId)
  return r.ok ? json(r) : json({ error: r.error }, r.status)
}
