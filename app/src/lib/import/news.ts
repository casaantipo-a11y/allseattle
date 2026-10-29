import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import type { ImportSource } from '@/payload-types'

import { slugify } from '../../fields'
import { fetchText } from './http'
import { parseFeed } from './rss'
import { oneLine, richTextFrom, safeLink, summaryFrom } from './text'
import { errorMessage, isUniqueViolation, newStats, skip, type ImportStats } from './types'

// News from RSS / Atom feeds, saved as drafts (status draft, origin import). No AI is
// involved: the draft carries the feed's own text, cleaned of markup, and the link to
// the original. The text belongs to its source, so an editor rewrites it in their own
// words before publishing — nothing goes live by itself. An item already imported from
// the same source — same externalId — is left alone, so a second run right after the
// first creates nothing; the unique (importSource, externalId) index is the backstop.
// Article pages are never fetched and images are not imported.

/** Only fresh stories are imported; older ones in the feed are not candidates. */
const NEWS_WINDOW_DAYS = 3
const DAY = 24 * 60 * 60 * 1000

export async function importNews(payload: Payload, source: ImportSource, deadline: number): Promise<ImportStats> {
  const stats = newStats()
  const max = source.maxItemsPerRun ?? 20

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
    const items = parseFeed(xml)
      .filter((i) => i.publishedAt && i.publishedAt.getTime() >= now - NEWS_WINDOW_DAYS * DAY && i.publishedAt.getTime() <= now + 60 * 60 * 1000)
      .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())

    const existing = new Set<string>()
    const rows = await payload.find({
      collection: 'news',
      where: { importSource: { equals: source.id } },
      pagination: false,
      depth: 0,
      select: { externalId: true },
    })
    for (const r of rows.docs) if (r.externalId) existing.add(r.externalId)

    // Aggregators (news.seattle.gov) repeat stories other feeds carry, with the same link
    // to the original. A story whose link is already on a news item — from any source —
    // is not imported again.
    const seenLinks = new Set<string>()
    const links = items.slice(0, max).flatMap((i) => safeLink(i.link) ?? [])
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
      existing.add(item.id)

      const title = oneLine(item.title, 200)
      const link = safeLink(item.link)
      if (!title || !link) {
        skip(stats, 'no title or link')
        continue
      }
      if (seenLinks.has(link)) {
        skip(stats, 'duplicate link')
        continue
      }
      seenLinks.add(link)

      try {
        // The slug field makes a slug from the title and adds no suffix, so a second
        // story with the same title would hit the unique index. The suffix comes from
        // the item's id, which keeps a re-run on the same slug. A slug is cut to 96
        // characters on save, so a long base is shortened to leave room for the suffix.
        const shortId = createHash('sha1').update(item.id).digest('hex').slice(0, 6)
        const base = slugify(title)
        const taken = base ? (await payload.count({ collection: 'news', where: { slug: { equals: base } } })).totalDocs > 0 : true
        const suffixed = base ? `${base.slice(0, 89).replace(/-+$/, '')}-${shortId}` : shortId

        await payload.create({
          collection: 'news',
          depth: 0,
          // Drafts aren't on the public site, so there is nothing to revalidate.
          context: { disableRevalidate: true },
          data: {
            title,
            excerpt: summaryFrom(item.text, 280) || title,
            ...(item.text ? { content: richTextFrom(item.text) } : {}),
            source: link,
            slug: taken ? suffixed : undefined,
            category: fallbackId,
            author: 'AllSeattle',
            status: 'draft',
            // Import time, as the field's own default would give; the editor sets it when publishing.
            publishedAt: new Date().toISOString(),
            origin: 'import',
            importSource: source.id,
            externalId: item.id,
          },
        })
        stats.created++
      } catch (e) {
        if (isUniqueViolation(e)) skip(stats, 'exists')
        else {
          stats.failed++
          stats.firstFailure ??= `${title.slice(0, 60)}: ${errorMessage(e)}`
        }
      }
    }
  } catch (e) {
    stats.error = errorMessage(e)
  }
  return stats
}
