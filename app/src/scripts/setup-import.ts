/**
 * pnpm import-setup — creates what the automatic import needs on a database that has
 * the tables (migration auto_import) but no sources yet: a news category for the city
 * feeds and the six import sources. Safe to run again: a source is matched by its type
 * and address, an existing one is left exactly as it is.
 *
 *   - news category: slug IMPORT_NEWS_CATEGORY (default "city-hall"), created as
 *     "City Hall" when missing
 *   - event category: slug IMPORT_EVENT_CATEGORY (default "community"), must exist —
 *     it is not created, so the event menu is never changed by accident
 *   - Ticketmaster is created switched off: it needs TICKETMASTER_API_KEY on the server,
 *     and an enabled source without it reports an error every run. Once the key is there,
 *     IMPORT_ENABLE_TICKETMASTER=1 switches it on (the only change this script makes to an
 *     existing source)
 *
 * Production: pnpm import-setup:prod (scripts/prod.mjs). Nothing here imports anything;
 * the first run is `pnpm import-run`.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const log = (m: string) => console.log(`[import-setup] ${m}`)

const FEEDS = [
  { name: 'Seattle Parks & Recreation', type: 'ics', target: 'events', url: 'https://www.trumba.com/calendars/parks-recreation.ics' },
  { name: 'Seattle.gov City-Wide', type: 'ics', target: 'events', url: 'https://www.trumba.com/calendars/seattlegov-city-wide.ics' },
  { name: 'News.seattle.gov', type: 'rss', target: 'news', url: 'https://news.seattle.gov/feed/' },
  { name: 'SDOT Blog', type: 'rss', target: 'news', url: 'https://sdotblog.seattle.gov/feed/' },
  { name: 'WSDOT Blog', type: 'rss', target: 'news', url: 'https://feeds.feedburner.com/wsdotblog' },
] as const

async function run() {
  const payload = await getPayload({ config })

  const eventSlug = process.env.IMPORT_EVENT_CATEGORY || 'community'
  const events = (await payload.find({ collection: 'event-categories', where: { slug: { equals: eventSlug } }, limit: 1, depth: 0 })).docs[0]
  if (!events) {
    const all = (await payload.find({ collection: 'event-categories', pagination: false, depth: 0, select: { slug: true } })).docs
    throw new Error(`No event category "${eventSlug}". Existing: ${all.map((c) => c.slug).join(', ') || 'none'}. Set IMPORT_EVENT_CATEGORY to one of them.`)
  }

  const newsSlug = process.env.IMPORT_NEWS_CATEGORY || 'city-hall'
  let news = (await payload.find({ collection: 'news-categories', where: { slug: { equals: newsSlug } }, limit: 1, depth: 0 })).docs[0]
  if (news) log(`news category "${newsSlug}" exists (id ${news.id})`)
  else {
    news = await payload.create({ collection: 'news-categories', data: { name: 'City Hall', slug: newsSlug }, context: { disableRevalidate: true } })
    log(`news category "${newsSlug}" created (id ${news.id})`)
  }

  const wanted = [
    { name: 'Ticketmaster Seattle', type: 'ticketmaster', target: 'events', url: undefined, enabled: false },
    ...FEEDS.map((f) => ({ ...f, enabled: true })),
  ] as const
  for (const s of wanted) {
    const found = (
      await payload.find({
        collection: 'import-sources',
        where: s.type === 'ticketmaster' ? { type: { equals: 'ticketmaster' } } : { and: [{ type: { equals: s.type } }, { url: { equals: s.url } }] },
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    if (found) {
      if (s.type === 'ticketmaster' && process.env.IMPORT_ENABLE_TICKETMASTER === '1' && !found.enabled) {
        await payload.update({ collection: 'import-sources', id: found.id, data: { enabled: true }, depth: 0 })
        log(`${s.name}: switched on (the key must be set on the server)`)
        continue
      }
      log(`${s.name}: already there (id ${found.id}, ${found.enabled ? 'enabled' : 'disabled'}) — left as it is`)
      continue
    }
    const made = await payload.create({
      collection: 'import-sources',
      depth: 0,
      data: {
        name: s.name,
        type: s.type,
        target: s.target,
        url: s.url,
        defaultCategory: s.target === 'news' ? { relationTo: 'news-categories', value: news.id } : { relationTo: 'event-categories', value: events.id },
        enabled: s.enabled,
        maxItemsPerRun: 20,
      },
    })
    log(`${s.name}: created (id ${made.id}, ${s.enabled ? 'enabled' : 'DISABLED until TICKETMASTER_API_KEY is set'})`)
  }
}

try {
  await run()
} catch (e) {
  console.error('[import-setup] failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}
process.exit(0)
