// Every absolute URL is built from NEXT_PUBLIC_SITE_URL — the domain is not
// chosen yet, and nothing in the code may name one.

export const SITE_TZ = 'America/Los_Angeles'

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

export const articlePath = (categorySlug: string, slug: string) => `/news/${categorySlug}/${slug}`
