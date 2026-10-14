import { deleteAccount } from '@/lib/account-delete'
import { customerFrom } from '@/lib/cabinet'

// POST /api/account/delete {password} — the signed-in customer deletes the account
// (lib/account-delete.ts) and is signed out.

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return Response.json({ error: 'Please log in first.' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { password?: unknown }
  const r = await deleteAccount(customer, typeof b.password === 'string' ? b.password : '')
  if (!r.ok) return Response.json({ error: r.error, fieldErrors: r.fieldErrors }, { status: r.status })
  const res = Response.json(r)
  res.headers.append('Set-Cookie', 'payload-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax')
  return res
}
