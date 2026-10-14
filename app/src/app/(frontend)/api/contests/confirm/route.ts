import { confirmVote } from '@/lib/contest-votes'

// POST /api/contests/confirm {token} — the "Confirm my vote" button on
// /contests/vote. A POST on purpose: mail scanners open links, they don't press buttons.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null
  const r = await confirmVote(typeof body?.token === 'string' ? body.token : '')
  return Response.json(r.ok ? r : { error: r.error, slug: r.slug }, { status: r.ok ? 200 : r.status })
}
