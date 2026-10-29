import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// Every outgoing request of the import goes through here: https only, a timeout,
// at most three redirects (each one checked again) and a 5 MB cap on the body. A
// feed address is typed into the admin and fetched by the server, so it must not
// be able to reach the server's own network.

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
    const v = ip.toLowerCase()
    // loopback, unspecified, unique-local (fc00::/7), link-local (fe80::/10), IPv4-mapped
    return v === '::1' || v === '::' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith('::ffff:')
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
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

async function readCapped(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length'))
  if (declared > MAX_BYTES) throw new FetchError('The answer is larger than 5 MB', res.status)
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new FetchError('The answer is larger than 5 MB', res.status)
    }
    chunks.push(value)
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks))
}

/**
 * GET a text answer. Error messages carry the host and the status only — never the
 * address, because Ticketmaster's key travels in it.
 */
export async function fetchText(raw: string, headers: Record<string, string> = {}): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let url = await assertPublicHttps(raw)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': `AllSeattle/1.0 (+${site})`, ...headers },
        signal: AbortSignal.timeout(20000),
      })
    } catch (e) {
      throw new FetchError(`${url.hostname}: ${e instanceof Error && e.name === 'TimeoutError' ? 'no answer in 20 seconds' : 'network error'}`)
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
    return readCapped(res)
  }
  throw new FetchError('Too many redirects')
}
