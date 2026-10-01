import { searchSite } from '@/lib/queries-phase3'

// GET /api/search?q= — suggestions for the header search box (spec §6).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const hits = q.trim().length >= 2 ? await searchSite(q, 8) : []
  return Response.json({ hits }, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
