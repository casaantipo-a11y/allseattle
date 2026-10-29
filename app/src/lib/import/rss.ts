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

function tag(block: string, name: string): string | null {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  return m ? unwrap(m[1]) : null
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
  const links = [...block.matchAll(/<link\b([^>]*)>/gi)].map((m) => m[1])
  const alt = links.find((a) => !/\brel="(?!alternate")/i.test(a)) ?? links[0]
  return plain(/\bhref="([^"]+)"/i.exec(alt ?? '')?.[1] ?? '')
}

/**
 * Every <item>…</item> / <entry>…</entry>. Walks the text once: a regex that looks for the
 * close tag from each opening one is quadratic on a feed full of unclosed tags.
 */
function blocksOf(xml: string): string[] {
  const lower = xml.toLowerCase()
  const open = /<(item|entry)\b/gi
  const blocks: string[] = []
  const noClose = new Set<string>()
  for (let m = open.exec(xml); m; m = open.exec(xml)) {
    const name = m[1].toLowerCase()
    if (noClose.has(name)) continue
    const close = `</${name}>`
    const end = lower.indexOf(close, open.lastIndex)
    if (end < 0) {
      noClose.add(name)
      continue
    }
    blocks.push(xml.slice(m.index, end + close.length))
    open.lastIndex = end + close.length
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
