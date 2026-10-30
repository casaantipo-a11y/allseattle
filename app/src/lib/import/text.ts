import { doc, p } from '../../scripts/lexical'

// Text from outside is never stored as it came: markup is stripped to plain text
// first (feeds put HTML into fields that look like plain text — ICS descriptions and
// locations carry <br> and <a>), and the rich text is built from that plain text.

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™', bull: '•', middot: '·',
  eacute: 'é', egrave: 'è', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä',
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, e: string) => {
    if (e[0] === '#') {
      const cp = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : ''
    }
    return NAMED[e.toLowerCase()] ?? whole
  })
}

// Feeds are not trusted, and these patterns run in one synchronous stretch the run's time
// limit cannot interrupt. A `[^>]*` or a lazy `[\s\S]*?` that finds no end rescans the rest of
// the text from every `<`, which is quadratic: 160 000 characters of `<br ` took 19 seconds.
// So a tag never contains `<`, and spans with no closing mark are found once, not per opening.

/** Cuts out every `<name …>…</name>` — script and style carry no text. An unclosed one stays as it is. */
function dropElements(h: string, name: string): string {
  const open = new RegExp(`<${name}(?![a-z0-9])[^<>]*>`, 'gi')
  const close = new RegExp(`</${name}\\s*>`, 'gi')
  let out = ''
  let pos = 0
  for (let m = open.exec(h); m; m = open.exec(h)) {
    close.lastIndex = open.lastIndex
    if (!close.exec(h)) break // nothing after this one can be closed either
    out += `${h.slice(pos, m.index)} `
    pos = close.lastIndex
    open.lastIndex = pos
  }
  return out + h.slice(pos)
}

function dropComments(h: string): string {
  let out = ''
  let pos = 0
  for (let s = h.indexOf('<!--'); s >= 0; s = h.indexOf('<!--', pos)) {
    const e = h.indexOf('-->', s + 4)
    if (e < 0) break
    out += `${h.slice(pos, s)} `
    pos = e + 3
  }
  return out + h.slice(pos)
}

// A tag starts with a letter, `/`, `!` or `?`: a bare "<" in the text ("under 5 < 6 and 7 > 3") stays.
const stripTags = (h: string) =>
  dropComments(dropElements(dropElements(h, 'script'), 'style'))
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/ul|\/ol)(?![a-z0-9])[^<>]*>/gi, '\n')
    .replace(/<[a-z!/?][^<>]*>/gi, ' ')

/** Longer input is cut: the importer keeps 60 lines of 4000 characters at most. */
const MAX_INPUT = 250_000

/**
 * Any HTML → plain text: tags dropped, block ends and <br> become line breaks,
 * entities decoded, whitespace tidied. Markup that only appears after decoding
 * (double-encoded, `&lt;b&gt;`) is stripped too.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  let t = decodeEntities(stripTags(html.length > MAX_INPUT ? html.slice(0, MAX_INPUT) : html))
  if (/<[a-z!/?][^<>]*>/i.test(t)) t = decodeEntities(stripTags(t))
  return t
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t ]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** One line: the text with all whitespace collapsed, cut to `max` characters. */
export function oneLine(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max).trim() : t
}

/** The first `max` characters of a text, cut at a word where there is one, "…" when cut. */
export function summaryFrom(text: string, max = 280): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
}

/** Plain text → Lexical: one paragraph per non-empty line, through the seed helper. */
export function richTextFrom(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 60)
  return doc(...lines.map((l) => p(l.slice(0, 4000))))
}

/** An http(s) link as a clean string, or nothing — `javascript:` and the like never get stored. */
export function safeLink(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const u = new URL(raw.trim())
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.href.length <= 500 ? u.href : undefined
  } catch {
    return undefined
  }
}
