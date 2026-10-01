/** Child sitemaps under /sitemaps/{type}.xml. */
export const SITEMAP_TYPES = ['static', 'news', 'businesses', 'cars', 'jobs', 'events', 'pages'] as const
export type SitemapType = (typeof SITEMAP_TYPES)[number]

// Hand-built sitemap XML. Next's metadata sitemap can't produce a sitemap
// index or Google News markup, so these are plain route handlers.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export type UrlEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: number }

export function urlset(entries: UrlEntry[]): string {
  const body = entries
    .map(
      (e) =>
        `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}${
          e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ''
        }${e.priority != null ? `<priority>${e.priority.toFixed(1)}</priority>` : ''}</url>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function sitemapIndex(locs: { loc: string; lastmod?: string }[]): string {
  const body = locs
    .map((s) => `<sitemap><loc>${esc(s.loc)}</loc>${s.lastmod ? `<lastmod>${s.lastmod}</lastmod>` : ''}</sitemap>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}

export function newsUrlset(
  items: { loc: string; title: string; publishedAt: string }[],
  publication: string,
): string {
  const body = items
    .map(
      (i) =>
        `<url><loc>${esc(i.loc)}</loc><news:news><news:publication><news:name>${esc(publication)}</news:name><news:language>en</news:language></news:publication><news:publication_date>${new Date(i.publishedAt).toISOString()}</news:publication_date><news:title>${esc(i.title)}</news:title></news:news></url>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${body}</urlset>`
}

export const xml = (body: string) =>
  new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' },
  })
