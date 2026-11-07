import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import type { ImportSource } from '@/payload-types'

import { slugify } from '../../fields'
import { dismissedOf } from './dismissed'
import { fetchText } from './http'
import { storePicture } from './images'
import { isAboutRegion, isRegionalOnlyFeed } from './region'
import { parseFeed } from './rss'
import { cleanFeedText, cleanLink, oneLine, richTextFrom, summaryFrom } from './text'
import { errorMessage, filtered, isUniqueViolation, newStats, skip, type ImportStats } from './types'

// News from RSS / Atom feeds, saved as drafts (status draft, origin import). No AI is
// involved: the draft carries the feed's own text, cleaned of markup, and the link to
// the original. The text belongs to its source, so an editor rewrites it in their own
// words before publishing — nothing goes live by itself. An item already imported from
// the same source — same externalId — is left alone, so a second run right after the
// first creates nothing; the unique (importSource, externalId) index is the backstop.
// Article pages are never fetched. A picture is taken only from the feed itself and only for
// a source with "Import pictures" on (images.ts); without it there is no cover.

/** Only fresh stories are imported; older ones in the feed are not candidates. */
const NEWS_WINDOW_DAYS = 3
const DAY = 24 * 60 * 60 * 1000
/**
 * Pictures a run asks for per source: this many stories are tried, and after this many in a
 * row that gave nothing (a feed of pictures too small, a host that is down) the rest are not.
 * Then the time left of the run's budget below which it stops asking.
 */
const MAX_PICTURE_TRIES = 8
const MAX_PICTURE_MISSES = 3
const PICTURE_MARGIN_MS = 15 * 1000
/** All the tries for one story's picture together. */
const PICTURE_BUDGET_MS = 12 * 1000

/** A video clip or a live blog: the page has no article, and the feed carries a line about it. */
const noArticle = (link: string) => {
  try {
    return /^\/(?:video|live-blog)\//i.test(new URL(link).pathname)
  } catch {
    return false
  }
}

export async function importNews(payload: Payload, source: ImportSource, deadline: number): Promise<ImportStats> {
  const stats = newStats()
  const max = source.maxItemsPerRun ?? 20
  const withPictures = source.importImages === true

  const fallback = source.defaultCategory
  const fallbackId = fallback?.relationTo === 'news-categories' ? (typeof fallback.value === 'object' ? fallback.value.id : fallback.value) : null
  if (!fallbackId) {
    stats.error = 'The default category is not a news category'
    return stats
  }
  if (source.type !== 'rss') {
    stats.error = `A news source cannot be of type ${source.type}`
    return stats
  }
  if (!source.url) {
    stats.error = 'The source has no address'
    return stats
  }

  try {
    const xml = await fetchText(source.url, { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' })
    if (!/<(?:rss|feed|rdf:RDF)\b/i.test(xml)) {
      stats.error = 'The address did not return an RSS or Atom feed'
      return stats
    }

    const now = Date.now()
    const fresh = parseFeed(xml)
      .filter((i) => i.publishedAt && i.publishedAt.getTime() >= now - NEWS_WINDOW_DAYS * DAY && i.publishedAt.getTime() <= now + 60 * 60 * 1000)
      .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())

    // The source's own rules come before the limit below: a run reads the newest `max` items
    // that pass, not the newest `max` of a feed that is mostly other states.
    const regionalOnly = isRegionalOnlyFeed(source.url)
    const items = fresh.filter((i) => {
      if (noArticle(i.link)) {
        filtered(stats, 'video or live blog')
        return false
      }
      if (regionalOnly && !isAboutRegion(i)) {
        filtered(stats, 'not about the Seattle area')
        return false
      }
      return true
    })

    const existing = new Set<string>()
    const rows = await payload.find({
      collection: 'news',
      where: { importSource: { equals: source.id } },
      pagination: false,
      depth: 0,
      select: { externalId: true },
    })
    for (const r of rows.docs) if (r.externalId) existing.add(r.externalId)
    const dismissed = dismissedOf(source)

    // Aggregators (news.seattle.gov) repeat stories other feeds carry, with the same link
    // to the original. A story whose link is already on a news item — from any source —
    // is not imported again.
    const seenLinks = new Set<string>()
    const links = items.slice(0, max).flatMap((i) => cleanLink(i.link) ?? [])
    if (links.length) {
      const dupes = await payload.find({
        collection: 'news',
        where: { source: { in: links } },
        pagination: false,
        depth: 0,
        select: { source: true },
      })
      for (const d of dupes.docs) if (d.source) seenLinks.add(d.source)
    }

    // `max` is how many items a run reads from the source, newest first — not how many
    // new ones it makes. Run twice in a row it reads the same ones, so the second run
    // creates nothing; a larger limit brings in more of the feed.
    let read = 0
    let pictureTries = 0
    let pictureMisses = 0
    const failedPictures = new Set<string>()
    for (const item of items) {
      if (read >= max) break
      read++
      if (Date.now() > deadline) {
        stats.error = 'Time limit reached — the rest comes in the next run'
        break
      }
      if (existing.has(item.id)) {
        skip(stats, 'exists')
        continue
      }
      if (dismissed.has(item.id)) {
        skip(stats, 'deleted by an editor')
        continue
      }
      existing.add(item.id)

      const title = oneLine(item.title, 200)
      const link = cleanLink(item.link)
      const text = cleanFeedText(item.text)
      if (!title || !link) {
        skip(stats, 'no title or link')
        continue
      }
      if (seenLinks.has(link)) {
        skip(stats, 'duplicate link')
        continue
      }
      seenLinks.add(link)

      // Only now — the story is new, so a picture is fetched once, never for a skipped one.
      // Whatever goes wrong with it, the draft is made anyway.
      let cover: number | undefined
      if (withPictures && item.images.length && pictureTries < MAX_PICTURE_TRIES && pictureMisses < MAX_PICTURE_MISSES && Date.now() < deadline - PICTURE_MARGIN_MS) {
        pictureTries++
        const id = await storePicture(payload, {
          candidates: item.images,
          alt: title,
          credit: `Photo: ${source.name}`,
          until: Math.min(deadline - 5000, Date.now() + PICTURE_BUDGET_MS),
          failed: failedPictures,
        })
        if (id) {
          cover = id
          pictureMisses = 0
        } else {
          pictureMisses++
        }
      }

      let saved = false
      try {
        // The slug field makes a slug from the title and adds no suffix, so a second
        // story with the same title would hit the unique index. The suffix comes from
        // the item's id, which keeps a re-run on the same slug. A slug is cut to 96
        // characters on save, so a long base is shortened to leave room for the suffix.
        const shortId = createHash('sha1').update(item.id).digest('hex').slice(0, 6)
        const base = slugify(title)
        const taken = base ? (await payload.count({ collection: 'news', where: { slug: { equals: base } } })).totalDocs > 0 : true
        const suffixed = base ? `${base.slice(0, 89).replace(/-+$/, '')}-${shortId}` : shortId

        const make = (slug?: string) =>
          payload.create({
            collection: 'news',
            depth: 0,
            // Drafts aren't on the public site, so there is nothing to revalidate.
            context: { disableRevalidate: true },
            data: {
              title,
              excerpt: summaryFrom(text, 280) || title,
              ...(text ? { content: richTextFrom(text) } : {}),
              ...(cover ? { cover } : {}),
              source: link,
              slug,
              category: fallbackId,
              author: 'AllSeattle',
              status: 'draft',
              // The time the source gave the story (never later than now: the feed window allows an hour ahead).
              // The editor can still change it when publishing.
              publishedAt: new Date(Math.min(item.publishedAt!.getTime(), Date.now())).toISOString(),
              origin: 'import',
              importSource: source.id,
              externalId: item.id,
            },
          })
        try {
          await make(taken ? suffixed : undefined)
        } catch (e) {
          // The slug was free when we looked and gone when we saved (another run, or a story
          // earlier in this feed): once more with the suffix. If this very story was saved by
          // the other run, the (importSource, externalId) index answers and it counts as existing.
          const slugTaken = (e as { data?: { errors?: { path?: string }[] } }).data?.errors?.some((x) => x.path === 'slug')
          if (taken || !slugTaken) throw e
          await make(suffixed)
        }
        saved = true
        stats.created++
        if (cover) stats.images = (stats.images ?? 0) + 1
      } catch (e) {
        if (isUniqueViolation(e)) skip(stats, 'exists')
        else {
          stats.failed++
          stats.firstFailure ??= `${title.slice(0, 60)}: ${errorMessage(e)}`
        }
      }
      // The picture was stored before the draft; a draft that did not get made must not leave it behind.
      if (cover && !saved) {
        await payload.delete({ collection: 'media', id: cover, overrideAccess: true }).catch((e) => console.error('[import] could not delete an unused picture', e))
      }
    }
  } catch (e) {
    stats.error = errorMessage(e)
  }
  return stats
}
