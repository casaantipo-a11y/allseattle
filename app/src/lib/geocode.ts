// Address → coordinates through OpenStreetMap's Nominatim (spec §4,
// Businesses). Its usage policy: at most one request per second and a
// User-Agent that identifies the application. Calls are chained through one
// promise so concurrent saves never break the rate, and each waits at least
// a second after the previous one.

let last = 0
let chain: Promise<unknown> = Promise.resolve()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type GeocodeResult = { lat: number; lng: number } | { error: string }

async function lookup(address: string): Promise<GeocodeResult> {
  const wait = last + 1100 - Date.now()
  if (wait > 0) await sleep(wait)
  last = Date.now()

  const q = /seattle|, wa\b|washington/i.test(address) ? address : `${address}, Seattle, WA`
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': `AllSeattle/1.0 (+${site})`, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { error: `Geocoding service answered ${res.status}` }
    const hits = (await res.json()) as { lat: string; lon: string }[]
    if (!hits.length) return { error: 'Address not found on the map — check it, or enter latitude and longitude by hand.' }
    return { lat: Number(hits[0].lat), lng: Number(hits[0].lon) }
  } catch (e) {
    return { error: `Geocoding failed: ${e instanceof Error ? e.message : 'network error'}` }
  }
}

export function geocode(address: string): Promise<GeocodeResult> {
  const next = chain.then(() => lookup(address))
  chain = next.catch(() => undefined)
  return next
}
