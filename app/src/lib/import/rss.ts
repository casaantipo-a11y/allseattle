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
    const body = tag(b, 'content:encoded') ?? tag(b, 'content') ?? tag(b, 'description') ?? tag(b, 'summary')
    if (!id) continue
    items.push({
      id: id.slice(0, 250),
      title: clean(tag(b, 'title')).replace(/\s+/g, ' '),
      link,
      publishedAt: Number.isNaN(when.getTime()) ? null : when,
      text: clean(body),
    })
  }
  return items
}
