// Every absolute URL is built from NEXT_PUBLIC_SITE_URL — the domain is not
// chosen yet, and nothing in the code may name one.

export const SITE_TZ = 'America/Los_Angeles'

/** Today's date in Seattle as YYYY-MM-DD. Day-only dates (a promotion's start and end) are
 *  whole Seattle days: compare `${seattleToday()}T00:00:00.000Z` / `T23:59:59.999Z`, whatever
 *  hour the picker stored (the admin's and the account's pickers store noon UTC). */
export const seattleToday = () => new Date().toLocaleDateString('en-CA', { timeZone: SITE_TZ })

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

export const articlePath = (categorySlug: string, slug: string) => `/news/${categorySlug}/${slug}`
