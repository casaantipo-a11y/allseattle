import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// Every outgoing request of the import goes through here: https only, one timeout for the
// whole exchange, at most three redirects (each one checked again) and a 5 MB cap on the body (4 MB and
// JPEG / PNG / WebP only for a picture: fetchImage). A feed address is typed into the admin
// and fetched by the server, and a picture address comes out of a feed nobody reads, so
// neither may be able to reach the server's own network.

const MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 3

export class FetchError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message)
  }
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    // Only global unicast, 2000::/3. That leaves out loopback, unique-local, link-local and site-local,
    // IPv4-mapped (::ffff:) and the NAT64 prefix (64:ff9b::), whose addresses can carry a private IPv4;
    // and inside it 6to4 (2002::/16), Teredo (2001::/32) and the documentation range, which can too.
    const v = ip.toLowerCase()
    const first = parseInt(v.split(':')[0] || '0', 16)
    return !(first >= 0x2000 && first <= 0x3fff) || first === 0x2002 || /^2001:(?:0{1,4})?:/.test(v) || /^2001:0?db8:/.test(v)
  }
  const [a, b, c] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 100 && b >= 64 && b <= 127)
  )
}

/** Throws unless the address is a plain https URL to a public host. */
export async function assertPublicHttps(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new FetchError('Not a valid address')
  }
  if (url.protocol !== 'https:') throw new FetchError('Only https:// addresses are allowed')
  if (url.username || url.password) throw new FetchError('Addresses with a login are not allowed')
  if (url.port && url.port !== '443') throw new FetchError('Only the standard https port is allowed')
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || /\.(localhost|local|internal|lan)$/.test(host)) throw new FetchError('Address points to a private host')
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new FetchError('Address points to a private host')
    return url
  }
  let found: { address: string }[]
  try {
    found = await lookup(host, { all: true })
  } catch {
    throw new FetchError(`Could not resolve ${host}`)
  }
  if (!found.length || found.some((a) => isPrivateIp(a.address))) throw new FetchError('Address points to a private host')
  return url
}

/** The body, never more than `max` bytes: a declared size over it is refused at once, an undeclared one is cut off. */
async function readBytes(res: Response, max: number): Promise<Buffer> {
  const tooBig = () => new FetchError(`The answer is larger than ${max / 1024 / 1024} MB`, res.status)
  const declared = Number(res.headers.get('content-length'))
  if (declared > max) {
    await res.body?.cancel()
    throw tooBig()
  }
  const reader = res.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel()
      throw tooBig()
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

const readCapped = async (res: Response) => new TextDecoder('utf-8').decode(await readBytes(res, MAX_BYTES))

/**
 * GET a text answer. Error messages carry the host and the status only — never the
 * address, because Ticketmaster's key travels in it.
 */
export async function fetchText(raw: string, headers: Record<string, string> = {}): Promise<string> {
  return readCapped(await get(raw, headers, 20000))
}

const IMAGE_TYPES: Record<string, 'jpeg' | 'png' | 'webp'> = { 'image/jpeg': 'jpeg', 'image/jpg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** Do the first bytes say what the server claims? Only the three formats the site takes. */
function looksLike(kind: 'jpeg' | 'png' | 'webp', b: Buffer): boolean {
  if (kind === 'jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (kind === 'png') return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  return b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'
}

/**
 * GET a picture: the same checks as fetchText (https, public hosts, every redirect checked again),
 * a shorter timeout, a 4 MB cap, and only JPEG, PNG or WebP — by the server's content type and
 * by the file's first bytes (an SVG or a page sent as "image/jpeg" is refused).
 */
export async function fetchImage(raw: string, { timeoutMs = 8000 }: { timeoutMs?: number } = {}): Promise<{ data: Buffer; type: 'jpeg' | 'png' | 'webp' }> {
  const res = await get(raw, { Accept: 'image/jpeg, image/png, image/webp' }, timeoutMs)
  const sent = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  const type = IMAGE_TYPES[sent]
  if (!type) {
    await res.body?.cancel()
    throw new FetchError(`${new URL(res.url || raw).hostname} sent ${sent || 'no content type'}, not a JPEG, PNG or WebP picture`, res.status)
  }
  const data = await readBytes(res, MAX_IMAGE_BYTES)
  if (!looksLike(type, data)) throw new FetchError('The file is not the picture its content type says')
  return { data, type }
}

/**
 * One checked GET: returns the final answer when it is 2xx; the caller reads the body.
 * `timeoutMs` is for the whole exchange — every redirect and the body that follows — not per hop.
 */
async function get(raw: string, headers: Record<string, string>, timeoutMs: number): Promise<Response> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const signal = AbortSignal.timeout(timeoutMs)
  let url = await assertPublicHttps(raw)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': `AllSeattle/1.0 (+${site})`, ...headers },
        signal,
      })
    } catch (e) {
      throw new FetchError(`${url.hostname}: ${e instanceof Error && e.name === 'TimeoutError' ? `no answer in ${timeoutMs / 1000} seconds` : 'network error'}`)
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      await res.body?.cancel()
      url = await assertPublicHttps(new URL(res.headers.get('location')!, url).href)
      continue
    }
    if (!res.ok) {
      await res.body?.cancel()
      throw new FetchError(`${url.hostname} answered ${res.status}`, res.status)
    }
    return res
  }
  throw new FetchError('Too many redirects')
}
