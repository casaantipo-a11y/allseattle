import config from '@payload-config'
import { getPayload } from 'payload'

import type { Role } from '@/access/roles'
import { seattleDate } from '@/lib/banners'
import { isDay } from '@/lib/day'
import { rowId } from '@/lib/row-id'

// GET /api/banners/report/{id}?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
// The advertiser report behind the "Report" tab of a banner in the admin:
// impressions, clicks and CTR per day and in total. Admin and sales only —
// checked against the admin session cookie. Defaults to the last 30 days.

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  const roles = ((user as { roles?: Role[] } | null)?.roles ?? []) as Role[]
  if (!roles.some((r) => r === 'admin' || r === 'sales'))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const id = rowId((await params).id)
  const banner = id > 0
    ? await payload.findByID({ collection: 'banners', id, depth: 0, disableErrors: true })
    : null
  if (!banner) return Response.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(req.url)
  const to = isDay(url.searchParams.get('to') ?? '')
    ? url.searchParams.get('to')!
    : seattleDate()
  const from = isDay(url.searchParams.get('from') ?? '')
    ? url.searchParams.get('from')!
    : seattleDate(new Date(new Date(`${to}T12:00:00Z`).getTime() - 29 * 86_400_000))

  const { docs } = await payload.find({
    collection: 'banner-stats',
    where: {
      and: [
        { banner: { equals: id } },
        { date: { greater_than_equal: from } },
        { date: { less_than_equal: to } },
      ],
    },
    sort: 'date',
    limit: 1000,
    depth: 0,
    pagination: false,
  })
  const ctr = (clicks: number, impressions: number) =>
    impressions ? +((clicks / impressions) * 100).toFixed(2) : 0
  const days = docs.map((d) => ({
    date: d.date,
    impressions: d.impressions,
    clicks: d.clicks,
    ctr: ctr(d.clicks, d.impressions),
  }))
  const impressions = days.reduce((s, d) => s + d.impressions, 0)
  const clicks = days.reduce((s, d) => s + d.clicks, 0)
  const total = { impressions, clicks, ctr: ctr(clicks, impressions) }

  if (url.searchParams.get('format') === 'csv') {
    // The advertiser's name is typed by the client, and a text cell that starts with = + - @ is a
    // formula to Excel (=HYPERLINK(…) would run on the sales team's machine): a leading ' shows it as text.
    const esc = (v: string | number) => {
      const s = typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [
      ['Advertiser', banner.advertiser],
      ['Period', `${from} to ${to}`],
      [],
      ['Date', 'Impressions', 'Clicks', 'CTR %'],
      ...days.map((d) => [d.date, d.impressions, d.clicks, d.ctr]),
      ['Total', total.impressions, total.clicks, total.ctr],
    ].map((row) => row.map(esc).join(','))
    const name = `${
      banner.advertiser
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'banner'
    }-${from}-${to}.csv`
    return new Response('\uFEFF' + lines.join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    })
  }
  return Response.json(
    { advertiser: banner.advertiser, from, to, days, total },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
