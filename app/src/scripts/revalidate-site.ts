// Asks the running site to drop its cached data (see /api/revalidate). If the
// site isn't running, nothing is cached anyway — or, in production, pages
// refresh on their own within an hour.
export async function revalidateSite(log: (m: string) => void) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  try {
    const res = await fetch(`${site}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': process.env.PAYLOAD_SECRET || '' },
      signal: AbortSignal.timeout(5000),
    })
    log(res.ok ? `site cache refreshed (${site})` : `site answered ${res.status} — pages refresh within an hour`)
  } catch {
    log(`site not reachable at ${site} — nothing to refresh`)
  }
}
