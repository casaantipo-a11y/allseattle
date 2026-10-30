import { FetchError, fetchText } from './http'
import { htmlToText, oneLine, safeLink } from './text'
import { SEATTLE_TZ, zonedToUtc } from './time'
import { skip, sleep, WINDOW_DAYS, type EventCandidate, type ImportStats } from './types'

// Ticketmaster Discovery API v2, /events.json, over plain fetch (like lib/stripe.ts).
// Off while TICKETMASTER_API_KEY is empty. Limits: 5000 calls a day and 5 a second on
// a default key — we stay at 2 a second, and one run reads a handful of pages. A 429
// stops the source for the day. The key travels in the query string, so nothing here
// logs or reports the address (fetchText's errors carry the host and status only).

const ENDPOINT = 'https://app.ticketmaster.com/discovery/v2/events.json'
// downtown Seattle (47.6062, -122.3321) as a geohash; `latlong` is deprecated in the API
const SEATTLE_GEOHASH = 'c23nb'
const RADIUS_MILES = 30
const PAGE_SIZE = 50
const PAUSE_MS = 500 // 2 requests a second
// The API refuses to page past the 1000th item (size × page < 1000).
const MAX_PAGES = Math.floor(1000 / PAGE_SIZE)

type Venue = {
  name?: string
  address?: { line1?: string }
  city?: { name?: string }
  state?: { stateCode?: string }
  postalCode?: string
  location?: { latitude?: string; longitude?: string }
}
type TmEvent = {
  id?: string
  name?: string
  url?: string
  info?: string
  pleaseNote?: string
  dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string }; status?: { code?: string } }
  priceRanges?: { min?: number; max?: number }[]
  classifications?: { segment?: { name?: string }; genre?: { name?: string } }[]
  _embedded?: { venues?: Venue[] }
}
type Page = { _embedded?: { events?: TmEvent[] }; page?: { totalPages?: number } }

// Ticketmaster's segment / genre → the slug of one of our event categories. A slug we
// don't have (categories are edited in the admin) falls back to the source's default.
// The genre wins over the segment: a "Family" show is a Miscellaneous or Arts one.
const BY_GENRE: Record<string, string> = {
  family: 'family-kids',
  "children's theatre": 'family-kids',
  'fairs & festivals': 'festivals-city-events',
  comedy: 'comedy-stand-up',
}
const BY_SEGMENT: Record<string, string> = {
  music: 'concerts-live-music',
  sports: 'sports-events',
  'arts & theatre': 'theater-musicals',
  film: 'movies-cinema',
}

function categorySlug(e: TmEvent): string | undefined {
  const c = e.classifications?.[0]
  return BY_GENRE[c?.genre?.name?.toLowerCase() ?? ''] ?? BY_SEGMENT[c?.segment?.name?.toLowerCase() ?? '']
}

const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

function priceOf(e: TmEvent): { isFree: boolean; price?: string } {
  const ranges = (e.priceRanges ?? []).filter((r) => typeof r.min === 'number' || typeof r.max === 'number')
  if (!ranges.length) return { isFree: false }
  const lows = ranges.map((r) => r.min ?? r.max!)
  const highs = ranges.map((r) => r.max ?? r.min!)
  const lo = Math.min(...lows)
  const hi = Math.max(...highs)
  if (hi === 0) return { isFree: true }
  return { isFree: false, price: lo === hi ? `$${money(lo)}` : `$${money(lo)}–${money(hi)}` }
}

function candidate(e: TmEvent, stats: ImportStats): EventCandidate | null {
  const name = oneLine(htmlToText(e.name), 200)
  const start = e.dates?.start
  if (!e.id || !name) {
    skip(stats, 'no id or title')
    return null
  }
  const code = e.dates?.status?.code
  if (code === 'cancelled' || code === 'postponed') {
    skip(stats, code)
    return null
  }
  // Local date and time in Seattle → UTC. Without a time the event is dated at midnight;
  // without a date there is nothing to show.
  const d = start?.localDate ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(start.localDate) : null
  const t = start?.localTime ? /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(start.localTime) : null
  let startAt: Date | null = null
  if (d) startAt = zonedToUtc(+d[1], +d[2], +d[3], t ? +t[1] : 0, t ? +t[2] : 0, t ? +(t[3] ?? 0) : 0, SEATTLE_TZ)
  else if (start?.dateTime) startAt = new Date(start.dateTime)
  if (!startAt || Number.isNaN(startAt.getTime())) {
    skip(stats, 'no date')
    return null
  }
  const venue = e._embedded?.venues?.[0]
  const venueName = oneLine(htmlToText(venue?.name), 200)
  if (!venueName) {
    skip(stats, 'no venue')
    return null
  }
  const street = oneLine(htmlToText(venue?.address?.line1), 200)
  const place = [venue?.city?.name, [venue?.state?.stateCode, venue?.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const lat = Number(venue?.location?.latitude)
  const lng = Number(venue?.location?.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
  return {
    externalId: e.id,
    title: name,
    startAt,
    venueName,
    address: [street, place].filter(Boolean).join(', ') || undefined,
    ...(hasCoords ? { lat, lng } : {}),
    ...priceOf(e),
    ticketUrl: safeLink(e.url),
    description: htmlToText([e.info, e.pleaseNote].filter(Boolean).join('\n')) || undefined,
    categorySlug: categorySlug(e),
  }
}

/**
 * Upcoming events around Seattle, soonest first, one page at a time — the caller
 * stops asking for more as soon as it has enough, and the generator then stops
 * calling the API.
 */
export async function* ticketmasterCandidates(stats: ImportStats, deadline: number): AsyncGenerator<EventCandidate> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) throw new Error('TICKETMASTER_API_KEY is not set')
  const now = new Date()
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  for (let page = 0; page < MAX_PAGES && Date.now() < deadline; page++) {
    if (page) await sleep(PAUSE_MS)
    const query = new URLSearchParams({
      apikey: key,
      geoPoint: SEATTLE_GEOHASH,
      radius: String(RADIUS_MILES),
      unit: 'miles',
      startDateTime: iso(now),
      endDateTime: iso(new Date(now.getTime() + WINDOW_DAYS * 86400000)),
      countryCode: 'US',
      locale: '*',
      sort: 'date,asc',
      size: String(PAGE_SIZE),
      page: String(page),
    })
    let body: Page
    try {
      body = JSON.parse(await fetchText(`${ENDPOINT}?${query}`, { Accept: 'application/json' })) as Page
    } catch (e) {
      if (e instanceof FetchError && e.status === 429) throw new Error('Ticketmaster rate limit reached (HTTP 429) — stopped until the next run')
      if (e instanceof SyntaxError) throw new Error('Ticketmaster sent an answer that is not JSON')
      throw e
    }
    for (const e of body._embedded?.events ?? []) {
      const c = candidate(e, stats)
      if (c) yield c
    }
    if (page + 1 >= (body.page?.totalPages ?? 0)) return
  }
}
