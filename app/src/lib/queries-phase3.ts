import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import type { CarListing, CarMake, Contest, Event, EventCategory, Job, JobCategory } from '@/payload-types'

import { EVENTS_COMING_SOON } from './events'

// Phase 3 reads: cars, jobs, events, contests, site statistics. Same rules as
// queries.ts — every read cached under a tag that the collection hooks expire.

const HOUR = 3600
const payload = () => getPayload({ config })
const published: Where = { status: { equals: 'published' } }
const notExpired = (field = 'expiresAt'): Where => ({
  or: [{ [field]: { exists: false } }, { [field]: { greater_than_equal: new Date().toISOString() } }],
})

export const getCarMakes = unstable_cache(
  async (): Promise<CarMake[]> => (await (await payload()).find({ collection: 'car-makes', limit: 500, sort: 'name', depth: 0 })).docs,
  ['car-makes'],
  { tags: ['cars'], revalidate: HOUR },
)

/** Published and not expired. */
export const getCars = unstable_cache(
  async (): Promise<CarListing[]> =>
    (
      await (await payload()).find({
        collection: 'car-listings',
        where: { and: [published, notExpired()] },
        limit: 2000,
        depth: 1,
        sort: '-createdAt',
      })
    ).docs,
  ['cars-all'],
  { tags: ['cars'], revalidate: HOUR },
)

const bySlug = <T>(collection: 'car-listings' | 'jobs' | 'events', tag: string, history = false) =>
  unstable_cache(
    async (slug: string): Promise<T | null> =>
      ((
        await (await payload()).find({
          collection,
          where: { and: [published, { [history ? 'slugHistory.slug' : 'slug']: { equals: slug } }] },
          limit: 1,
          depth: history ? 0 : 2,
        })
      ).docs[0] as T | undefined) ?? null,
    [`${collection}-${history ? 'old-slug' : 'slug'}`],
    { tags: [tag, 'businesses'], revalidate: HOUR },
  )

export const getCar = bySlug<CarListing>('car-listings', 'cars')
export const findCarByOldSlug = bySlug<CarListing>('car-listings', 'cars', true)
export const getJob = bySlug<Job>('jobs', 'jobs')
export const findJobByOldSlug = bySlug<Job>('jobs', 'jobs', true)
export const getEvent = bySlug<Event>('events', 'events')
export const findEventByOldSlug = bySlug<Event>('events', 'events', true)

export const getJobCategories = unstable_cache(
  async (): Promise<JobCategory[]> =>
    (await (await payload()).find({ collection: 'job-categories', limit: 200, sort: 'name', depth: 0 })).docs,
  ['job-categories'],
  { tags: ['jobs'], revalidate: HOUR },
)

export const getJobs = unstable_cache(
  async (): Promise<Job[]> =>
    (
      await (await payload()).find({
        collection: 'jobs',
        where: { and: [published, notExpired()] },
        limit: 2000,
        depth: 1,
        sort: '-createdAt',
      })
    ).docs,
  ['jobs-all'],
  { tags: ['jobs', 'businesses'], revalidate: HOUR },
)

export const getEventCategories = unstable_cache(
  async (): Promise<EventCategory[]> =>
    (await (await payload()).find({ collection: 'event-categories', limit: 200, sort: 'order', depth: 0 })).docs,
  ['event-categories'],
  { tags: ['events'], revalidate: HOUR },
)

/** Events not over yet: an end in the future, or (without an end) a start within the last 24 hours. */
/** Upcoming events for the home page, the map and the sitemap — none while the section
 *  is "Coming soon" (lib/events.ts). The events page itself reads them directly. */
export async function getUpcomingEvents(): Promise<Event[]> {
  return EVENTS_COMING_SOON ? [] : getAllUpcomingEvents()
}

export const getAllUpcomingEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    return (
      await (await payload()).find({
        collection: 'events',
        where: {
          and: [
            published,
            { or: [{ endAt: { greater_than_equal: new Date().toISOString() } }, { startAt: { greater_than_equal: dayAgo } }] },
          ],
        },
        limit: 1000,
        depth: 1,
        sort: 'startAt',
      })
    ).docs
  },
  ['events-upcoming'],
  { tags: ['events'], revalidate: 600 },
)

export const getContest = unstable_cache(
  async (slug: string): Promise<Contest | null> =>
    (await (await payload()).find({ collection: 'contests', where: { slug: { equals: slug } }, limit: 1, depth: 1 })).docs[0] ?? null,
  ['contest'],
  { tags: ['contests'], revalidate: HOUR },
)

/** The contest for the home page: an active one, else an upcoming one. */
export const getFeaturedContest = unstable_cache(
  async (): Promise<Contest | null> => {
    const p = await payload()
    for (const status of ['active', 'upcoming'] as const) {
      const res = await p.find({ collection: 'contests', where: { status: { equals: status } }, limit: 1, depth: 1, sort: '-updatedAt' })
      if (res.docs[0]) return res.docs[0]
    }
    return null
  },
  ['contest-featured'],
  { tags: ['contests'], revalidate: HOUR },
)

export const getContestsForSitemap = unstable_cache(
  async (): Promise<Pick<Contest, 'slug' | 'updatedAt'>[]> =>
    (await (await payload()).find({ collection: 'contests', limit: 200, depth: 0, select: { slug: true, updatedAt: true } })).docs,
  ['contests-sitemap'],
  { tags: ['contests'], revalidate: HOUR },
)

/** Midnight in Seattle today, as an ISO instant. */
function seattleMidnight(now = new Date()): string {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'shortOffset' })
    .formatToParts(now)
    .find((x) => x.type === 'timeZoneName')?.value // e.g. "GMT-7"
  const h = Number(tz?.replace('GMT', '') || '-8')
  return new Date(`${day}T00:00:00${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:00`).toISOString()
}

/**
 * Site statistics for the home page (spec §3): businesses, car listings, jobs
 * and events — in total and added today (Seattle day). Cached for 10 minutes.
 */
export const getSiteStats = unstable_cache(
  async () => {
    const p = await payload()
    const since = seattleMidnight()
    const pair = async (collection: 'businesses' | 'car-listings' | 'jobs' | 'events') => {
      const [all, today] = await Promise.all([
        p.count({ collection, where: published }),
        p.count({ collection, where: { and: [published, { createdAt: { greater_than_equal: since } }] } }),
      ])
      return { total: all.totalDocs, today: today.totalDocs }
    }
    const [businesses, cars, jobs, events] = await Promise.all([pair('businesses'), pair('car-listings'), pair('jobs'), pair('events')])
    return { businesses, cars, jobs, events }
  },
  ['site-stats'],
  { tags: ['businesses', 'cars', 'jobs', 'events'], revalidate: 600 },
)

export type SearchHit = { id: number; title: string; url: string; excerpt?: string | null; kind: string }

// Words that name a section: "car" or "cars" also brings the car listings, whose
// titles ("2021 Toyota Camry") never contain the word itself.
const KIND_WORDS: Record<string, string> = {
  car: 'car-listings', cars: 'car-listings', auto: 'car-listings', autos: 'car-listings', vehicle: 'car-listings', vehicles: 'car-listings',
  job: 'jobs', jobs: 'jobs', vacancy: 'jobs', vacancies: 'jobs',
  event: 'events', events: 'events',
  news: 'news', business: 'businesses', businesses: 'businesses',
}
const PRIORITY: Record<string, number> = { businesses: 40, news: 30, events: 20, jobs: 20, 'car-listings': 10 }
const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Global search over the plugin-search index (spec §6). Matches are ranked by how well
 *  they match (client, 13.10.2026: "car" listed a dealership whose description says "car"
 *  above "Rainier Car Rental", and "Urgent Care" came up at all): the whole word in the
 *  title, then the section the word names, then the whole word in the text, then a word
 *  that only starts with it ("car" → "Care"), then text inside a word. The type of record
 *  only breaks ties. */
export async function searchSite(q: string, limit = 60): Promise<SearchHit[]> {
  const term = q.trim()
  if (term.length < 2) return []
  const lower = term.toLowerCase()
  const kind = KIND_WORDS[lower]
  const res = await (await payload()).find({
    collection: 'search',
    where: {
      and: [
        { isPublished: { equals: true } },
        {
          or: [
            { title: { like: term } },
            { excerpt: { like: term } },
            { keywords: { like: term } },
            ...(kind ? [{ kind: { equals: kind } }] : []),
          ],
        },
      ],
    },
    limit: 500,
    depth: 0,
  })
  const t = escapeRe(lower)
  const word = new RegExp(`(^|[^a-z0-9])${t}(s|es)?($|[^a-z0-9])`, 'i')
  const prefix = new RegExp(`(^|[^a-z0-9])${t}`, 'i')
  const score = (text: string, whole: number, start: number, inside: number) =>
    word.test(text) ? whole : prefix.test(text) ? start : text.toLowerCase().includes(lower) ? inside : 0
  const ranked = res.docs.map((d) => {
    const title = String(d.title ?? '')
    const text = `${(d as { excerpt?: string }).excerpt ?? ''} ${(d as { keywords?: string }).keywords ?? ''}`
    const k = String((d as { kind?: string }).kind ?? '')
    const rank = Math.max(score(title, 100, 30, 10), kind === k ? 60 : 0, score(text, 40, 20, 5))
    return { d, rank, title, k }
  })
  ranked.sort((a, b) => b.rank - a.rank || (PRIORITY[b.k] ?? 0) - (PRIORITY[a.k] ?? 0) || a.title.localeCompare(b.title))
  return ranked
    .filter(({ k }) => !(EVENTS_COMING_SOON && k === 'events'))
    .slice(0, limit)
    .map(({ d }) => ({
    id: d.id as number,
    title: (d.title as string) ?? '',
    url: (d as { url?: string }).url ?? '/',
    excerpt: (d as { excerpt?: string }).excerpt,
    kind: (d as { kind?: string }).kind ?? '',
  }))
}
