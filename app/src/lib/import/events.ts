import type { Payload } from 'payload'

import type { ImportSource } from '@/payload-types'

import { dismissedOf } from './dismissed'
import { fetchText } from './http'
import { icsCandidates } from './ics'
import { htmlToText, richTextFrom, summaryFrom } from './text'
import { ticketmasterCandidates } from './ticketmaster'
import { errorMessage, isUniqueViolation, newStats, skip, type EventCandidate, type ImportStats } from './types'

// Events from Ticketmaster and ICS feeds, saved as drafts (status draft, origin
// import) for an editor to publish. An item already imported from the same source —
// same externalId — is left alone, so a second run right after the first creates
// nothing; the unique (importSource, externalId) index is the backstop if two runs
// ever overlap. Images are not imported.

/** Nominatim allows one request a second and each save waits for it, so a run geocodes at most this many. */
const GEOCODE_CAP = 10

const venueKey = (c: EventCandidate) => `${c.venueName}|${c.address ?? ''}`

/**
 * Coordinates of an event we already have at the same venue — same name, and the same
 * address when we know one (two "Community Center"s are not one place).
 */
async function knownCoords(payload: Payload, c: EventCandidate) {
  const { docs } = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    pagination: false,
    select: { lat: true, lng: true },
    where: {
      and: [
        { venueName: { equals: c.venueName } },
        { lat: { exists: true } },
        { lng: { exists: true } },
        ...(c.address ? [{ address: { equals: c.address } }] : []),
      ],
    },
  })
  const d = docs[0]
  return d && d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null
}

async function* candidatesOf(source: ImportSource, stats: ImportStats, deadline: number): AsyncGenerator<EventCandidate> {
  if (source.type === 'ticketmaster') {
    yield* ticketmasterCandidates(stats, deadline)
  } else if (source.type === 'ics') {
    if (!source.url) throw new Error('The source has no address')
    const text = await fetchText(source.url, { Accept: 'text/calendar, text/plain' })
    if (!text.trimStart().startsWith('BEGIN:VCALENDAR')) throw new Error('The address did not return an ICS calendar')
    yield* icsCandidates(text, stats)
  } else {
    throw new Error(`An event source cannot be of type ${source.type}`)
  }
}

export async function importEvents(payload: Payload, source: ImportSource, deadline: number): Promise<ImportStats> {
  const stats = newStats()
  const max = source.maxItemsPerRun ?? 20

  const fallback = source.defaultCategory
  const fallbackId = fallback?.relationTo === 'event-categories' ? (typeof fallback.value === 'object' ? fallback.value.id : fallback.value) : null
  if (!fallbackId) {
    stats.error = 'The default category is not an event category'
    return stats
  }

  try {
    const categories = new Map<string, number>()
    for (const c of (await payload.find({ collection: 'event-categories', pagination: false, depth: 0, select: { slug: true } })).docs) {
      if (c.slug) categories.set(c.slug, c.id)
    }
    const existing = new Set<string>()
    const rows = await payload.find({
      collection: 'events',
      where: { importSource: { equals: source.id } },
      pagination: false,
      depth: 0,
      select: { externalId: true },
    })
    for (const r of rows.docs) if (r.externalId) existing.add(r.externalId)
    const dismissed = dismissedOf(source)

    let geocodes = 0
    const geocodeFailed = new Set<string>()

    // `max` is how many items a run reads from the source, soonest first — not how many
    // new ones it makes. Run twice in a row it reads the same ones, so the second run
    // creates nothing; a larger limit brings in more of the feed.
    let read = 0
    for await (const c of candidatesOf(source, stats, deadline)) {
      if (read >= max) break
      read++
      if (Date.now() > deadline) {
        stats.error = 'Time limit reached — the rest comes in the next run'
        break
      }
      if (existing.has(c.externalId)) {
        skip(stats, 'exists')
        continue
      }
      if (dismissed.has(c.externalId)) {
        skip(stats, 'deleted by an editor')
        continue
      }
      existing.add(c.externalId)

      let coords = c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null
      let skipGeocode = true
      if (!coords) {
        coords = await knownCoords(payload, c)
        if (!coords && c.address && !geocodeFailed.has(venueKey(c)) && geocodes < GEOCODE_CAP) {
          geocodes++
          skipGeocode = false // the Events hook looks the address up
        }
      }

      const description = c.description ? htmlToText(c.description) : ''
      try {
        const doc = await payload.create({
          collection: 'events',
          depth: 0,
          // Drafts aren't on the public site, so there is nothing to revalidate.
          context: { disableRevalidate: true, skipGeocode },
          data: {
            title: c.title,
            startAt: c.startAt.toISOString(),
            ...(c.endAt ? { endAt: c.endAt.toISOString() } : {}),
            category: (c.categorySlug && categories.get(c.categorySlug)) || fallbackId,
            venueName: c.venueName,
            address: c.address,
            ...(coords ?? {}),
            isFree: c.isFree,
            price: c.price,
            ticketUrl: c.ticketUrl,
            summary: description ? summaryFrom(description, 280) : undefined,
            ...(description ? { description: richTextFrom(description) } : {}),
            status: 'draft',
            origin: 'import',
            importSource: source.id,
            externalId: c.externalId,
          },
        })
        stats.created++
        if (!skipGeocode && doc.lat == null) geocodeFailed.add(venueKey(c))
      } catch (e) {
        if (isUniqueViolation(e)) skip(stats, 'exists')
        else {
          stats.failed++
          stats.firstFailure ??= `${c.title.slice(0, 60)}: ${errorMessage(e)}`
        }
      }
    }
  } catch (e) {
    stats.error = errorMessage(e)
  }
  return stats
}
