import config from '@payload-config'
import { getPayload } from 'payload'

import { isBot, recordBannerStats } from '@/lib/banners'

// GET /api/banners/click/{id} — every banner links here: the click is counted
// for today (unless it's a bot) and the visitor is sent on with a 302 to the
// advertiser's linkUrl. An unknown or unpublished banner goes to the home page.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const home = new URL('/', req.url)
  if (!Number.isInteger(id) || id <= 0) return Response.redirect(home, 302)

  const payload = await getPayload({ config })
  const banner = await payload.findByID({
    collection: 'banners',
    id,
    depth: 0,
    disableErrors: true,
  })
  if (!banner || banner.status !== 'published' || !/^https?:\/\//i.test(banner.linkUrl))
    return Response.redirect(home, 302)

  if (!isBot(req.headers.get('user-agent'))) {
    try {
      await recordBannerStats([{ id, clicks: 1 }])
    } catch (err) {
      // Never block the visitor on a stats hiccup.
      console.error('banner click', err)
    }
  }
  return new Response(null, {
    status: 302,
    headers: { Location: banner.linkUrl, 'Cache-Control': 'no-store' },
  })
}
