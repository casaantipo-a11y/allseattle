import { saveAd } from '@/lib/ad-billing'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/ads/:id — the buyer uploads the banner picture(s) and sets the
// name and link; the banner goes to the team as Pending review.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return Response.json({ error: 'Banner not found.' }, { status: 404 })
  const customer = await customerFrom(req)
  if (!customer) return Response.json({ error: 'Please log in first.' }, { status: 401 })
  const fd = await req.formData().catch(() => null)
  if (!fd) return Response.json({ error: 'Could not read the form. The picture may be too large.' }, { status: 400 })
  const r = await saveAd(customer, Number(id), fd)
  return r.ok ? Response.json(r) : Response.json({ error: r.error, fieldErrors: r.fieldErrors }, { status: r.status })
}
