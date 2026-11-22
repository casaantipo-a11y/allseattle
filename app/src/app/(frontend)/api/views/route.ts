import { isBot } from '@/lib/banners'
import { recordSiteView, recordView } from '@/lib/stats'

// POST /api/views {kind: car | job | business, id} — one view of a car, job or business
// page (ViewBeacon, once per browser session); {kind: 'site'} — one page view of the
// site (SiteViewBeacon). Direct atomic SQL (lib/stats.ts): going through payload.update
// would run the collection hooks and revalidate the pages on every view. Only published
// documents count; a bot's request is dropped.

export async function POST(req: Request) {
  if (isBot(req.headers.get('user-agent'))) return new Response(null, { status: 204 })
  const body = (await req.json().catch(() => null)) as { kind?: unknown; id?: unknown } | null
  const kind = body?.kind
  try {
    if (kind === 'site') {
      await recordSiteView()
    } else if (kind === 'car' || kind === 'job' || kind === 'business') {
      const id = Number(body?.id)
      if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Bad request' }, { status: 400 })
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
