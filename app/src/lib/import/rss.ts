import { htmlToText } from './text'

// A small RSS 2.0 / Atom reader for the news feeds (WordPress blogs, Feedburner).
// No XML library: the feeds are flat, and every field is turned into plain text
// (htmlToText) before anything else sees it. Article pages are never fetched —
// the text is what the feed carries.

export type FeedItem = {
  /** guid / id, else the link. */
  id: string
  title: string
  link: string
  publishedAt: Date | null
  /** Plain text of the full content when the feed has it, else of the summary. */
  text: string
  /** Addresses of the story's picture found in the feed itself, best first (https only, at most 4). */
  images: string[]
}

const unwrap = (raw: string) => /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw)?.[1] ?? raw

// A feed is not trusted and these patterns run in one stretch the run's time limit cannot
// interrupt: a tag never contains `<`, and a missing close tag is looked for once. A single
// regex `<name…>([\s\S]*?)</name>` rescans the whole item from every opening that has no end.
function tag(block: string, name: string): string | null {
  const open = new RegExp(`<${name}(?=[\\s>/])[^<>]*>`, 'gi')
  for (let m = open.exec(block); m; m = open.exec(block)) {
    if (m[0].endsWith('/>')) continue // <link href="…"/> has no body
    const close = new RegExp(`</${name}\\s*>`, 'gi')
    close.lastIndex = open.lastIndex
    const end = close.exec(block)
    return end ? unwrap(block.slice(open.lastIndex, end.index)) : null
  }
  return null
}

/**
 * Feed text → plain text. HTML carried inside XML (Atom `type="html"`) is escaped twice,
 * so an `&amp;amp;` is still an entity after the first pass: one more pass settles it.
 */
const clean = (raw: string | null) => {
  const once = htmlToText(raw)
  return /&(?:#x?[0-9a-f]+|[a-z][a-z0-9]*);/i.test(once) ? htmlToText(once) : once
}

/** A link or id: unwrapped, with the XML `&amp;` undone, nothing else. */
const plain = (s: string | null) => unwrap(s ?? '').replace(/&amp;/g, '&').trim()

function linkOf(block: string): string {
  // RSS: <link>url</link>. Atom: <link rel="alternate" href="url"/> (rel optional).
  const rss = tag(block, 'link')
  if (rss && /^\s*https?:/i.test(rss)) return plain(rss)
  const links = [...block.matchAll(/<link\b([^<>]*)>/gi)].map((m) => m[1])
  const alt = links.find((a) => !/\brel="(?!alternate")/i.test(a)) ?? links[0]
  return plain(/\bhref="([^"]+)"/i.exec(alt ?? '')?.[1] ?? '')
}

// ---- Pictures -------------------------------------------------------------------------
// Only what the feed itself carries: <media:content>, <enclosure>, the first <img> of the
// text, and <media:thumbnail> when it is a real size. An article page is never fetched.
// Same rule as above for patterns: a tag never contains `<` or `>`, so nothing rescans.

/** Every `<name …>` tag of the block (at most `limit`, each cut at 4000 characters). */
function tagsOf(block: string, name: string, limit = 6): string[] {
  const re = new RegExp(`<${name}(?=[\\s/>])[^<>]*>`, 'gi')
  const out: string[] = []
  for (let m = re.exec(block); m && out.length < limit; m = re.exec(block)) out.push(m[0].slice(0, 4000))
  return out
}

function attrOf(tagText: string, name: string): string | undefined {
  const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tagText)
  return m ? (m[1] ?? m[2]) : undefined
}

/** An https address, the XML `&amp;` undone; anything else (http, data:, a relative path) is not a candidate. */
function pictureUrl(raw: string | undefined): string | null {
  const u = (raw ?? '').replace(/&amp;/g, '&').trim()
  return /^https:\/\/[^\s"'<>]{4,490}$/i.test(u) ? u : null
}

/**
 * A WordPress thumbnail (…/wp-content/uploads/…/name-150x150.jpg) is a cut of the original
 * that sits next to it (…/name.jpg). The feeds of the city blogs carry only the 150 px cut.
 */
export function fullSizeOf(url: string): string {
  return url.includes('/wp-content/uploads/') ? url.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))(?=$|\?)/i, '$1') : url
}

/** HTML carried inside XML (Atom `type="html"`) arrives escaped: one level of it is undone to find the <img>. */
const unescapeMarkup = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&(?:#0?39|apos);/g, "'").replace(/&amp;/g, '&')

/** The picture candidates of one item, best first. Too-small ones (a 1 px counter, a 72 px thumbnail) are left out. */
export function imagesOf(block: string, bodies: string): string[] {
  const out: string[] = []
  const add = (raw: string | undefined) => {
    const url = pictureUrl(raw)
    if (!url) return
    // The original first when this is a WordPress cut; the cut itself stays as the fallback.
    for (const v of [fullSizeOf(url), url]) if (!out.includes(v)) out.push(v)
  }
  // A declared size under the minimum rules a tag out; no declared size passes (the real size is checked on download).
  const sizeOk = (t: string, attr: 'width' | 'height', min: number) => {
    const n = Number(attrOf(t, attr))
    return !(n > 0 && n < min)
  }

  for (const t of tagsOf(block, 'media:content')) {
    const type = attrOf(t, 'type')
    const medium = attrOf(t, 'medium')
    const url = attrOf(t, 'url')
    if (medium === 'image' || type?.toLowerCase().startsWith('image/') || (!type && !medium && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url ?? ''))) add(url)
  }
  for (const t of tagsOf(block, 'enclosure')) {
    if (attrOf(t, 'type')?.toLowerCase().startsWith('image/')) add(attrOf(t, 'url'))
  }
  const html = bodies.includes('&lt;img') ? `${bodies}\n${unescapeMarkup(bodies)}` : bodies
  for (const t of tagsOf(html, 'img', 3)) {
    if (sizeOk(t, 'width', 100) && sizeOk(t, 'height', 100)) add(attrOf(t, 'src'))
  }
  for (const t of tagsOf(block, 'media:thumbnail')) {
    if (sizeOk(t, 'width', 300)) add(attrOf(t, 'url'))
  }
  return out.slice(0, 4)
}

/**
 * Every <item>…</item> / <entry>…</entry>. Walks the text once: a regex that looks for the
 * close tag from each opening one is quadratic on a feed full of unclosed tags.
 */
function blocksOf(xml: string): string[] {
  const open = /<(item|entry)\b/gi
  // Searched with a pattern, not in a lowercased copy: toLowerCase can change the length of
  // the text ("İ" becomes two characters), which would shift every position after it.
  const closers: Record<string, RegExp> = { item: /<\/item>/gi, entry: /<\/entry>/gi }
  const blocks: string[] = []
  const noClose = new Set<string>()
  for (let m = open.exec(xml); m; m = open.exec(xml)) {
    const name = m[1].toLowerCase()
    if (noClose.has(name)) continue
    const close = closers[name]
    close.lastIndex = open.lastIndex
    if (!close.exec(xml)) {
      noClose.add(name)
      continue
    }
    blocks.push(xml.slice(m.index, close.lastIndex))
    open.lastIndex = close.lastIndex
  }
  return blocks
}

export function parseFeed(xml: string): FeedItem[] {
  const blocks = blocksOf(xml)
  const items: FeedItem[] = []
  for (const b of blocks) {
    const link = linkOf(b)
    const id = plain(tag(b, 'guid') ?? tag(b, 'id')) || link
    const when = new Date(plain(tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated')))
    const full = tag(b, 'content:encoded') ?? tag(b, 'content')
    const short = tag(b, 'description') ?? tag(b, 'summary')
    const body = full ?? short
    if (!id) continue
    items.push({
      id: id.slice(0, 250),
      title: clean(tag(b, 'title')).replace(/\s+/g, ' '),
      link,
      publishedAt: Number.isNaN(when.getTime()) ? null : when,
      text: clean(body),
      // The picture may sit in either the full text or the summary.
      images: imagesOf(b, [full, short].filter(Boolean).join('\n').slice(0, 100_000)),
    })
  }
  return items
}
