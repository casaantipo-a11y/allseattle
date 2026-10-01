import { isBot, knownBannerIds, recordBannerStats } from '@/lib/banners'

// POST /api/banners/impressions — the browser's batched impression counts
// ({ impressions: { [bannerId]: n } }, from bannerTracker.ts, often via
// sendBeacon). Bots are ignored, unknown ids dropped, and one request can add
// at most MAX_PER_BANNER per banner — a page has a handful of slots, so
// anything above that is not a real visitor.

const MAX_PER_BANNER = 20

export async function POST(req: Request) {
  if (isBot(req.headers.get('user-agent'))) return new Response(null, { status: 204 })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const counts = (body as { impressions?: Record<string, unknown> })?.impressions
  if (!counts || typeof counts !== 'object')
    return Response.json({ error: 'Bad request' }, { status: 400 })

  const known = await knownBannerIds()
  const entries = Object.entries(counts)
    .slice(0, 50)
    .map(([id, n]) => ({
      id: Number(id),
      impressions: Math.min(MAX_PER_BANNER, Math.floor(Number(n))),
    }))
    .filter((e) => known.has(e.id) && e.impressions > 0)
  try {
    await recordBannerStats(entries)
  } catch (err) {
    console.error('banner impressions', err)
    return Response.json({ error: 'Not saved' }, { status: 500 })
  }
  return new Response(null, { status: 204 })
}
