import { isBot } from '@/lib/banners'
import { recordClick, recordSiteView, recordView } from '@/lib/stats'

// POST /api/views {kind: car | job | business, id} — one view of a car, job or business
// page (ViewBeacon, once per browser session); {kind: 'site'} — one page view of the
// site (SiteViewBeacon). Direct atomic SQL (lib/stats.ts): going through payload.update
// would run the collection hooks and revalidate the pages on every view. Only published
// documents count; a bot's request is dropped. {kind: business-website | business-call, id} is
// one click on "Website" / "Call" of a published business (TrackedLink): the owner's stats only.

/** A row id that fits the database's integer column (a huge number is a 400, not a database error). */
const goodId = (n: number) => Number.isSafeInteger(n) && n > 0 && n <= 2147483647

export async function POST(req: Request) {
  if (isBot(req.headers.get('user-agent'))) return new Response(null, { status: 204 })
  const body = (await req.json().catch(() => null)) as { kind?: unknown; id?: unknown } | null
  const kind = body?.kind
  try {
    if (kind === 'site') {
      await recordSiteView()
    } else if (kind === 'business-website' || kind === 'business-call') {
      const id = Number(body?.id)
      if (!goodId(id)) return Response.json({ error: 'Bad request' }, { status: 400 })
      await recordClick(kind, id)
    } else if (kind === 'car' || kind === 'job' || kind === 'business') {
      const id = Number(body?.id)
      if (!goodId(id)) return Response.json({ error: 'Bad request' }, { status: 400 })
      await recordView(kind, id)
    } else {
      return Response.json({ error: 'Bad request' }, { status: 400 })
    }
  } catch (e) {
    console.error('[views]', e)
    return Response.json({ error: 'Not saved' }, { status: 500 })
  }
  return new Response(null, { status: 204 })
}
