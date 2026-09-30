import { notFound } from 'next/navigation'

import { getNewsCategories, getNewsForSitemap, getPagesForSitemap } from '@/lib/queries'
import { absoluteUrl, articlePath } from '@/lib/site'
import { SITEMAP_TYPES, type SitemapType, type UrlEntry, urlset, xml } from '@/lib/sitemap'

export const revalidate = 3600

export function generateStaticParams() {
  return SITEMAP_TYPES.map((t) => ({ type: `${t}.xml` }))
}

async function entries(type: SitemapType): Promise<UrlEntry[]> {
  if (type === 'static') {
    const categories = await getNewsCategories()
    return [
      { loc: absoluteUrl('/'), changefreq: 'hourly', priority: 1 },
      { loc: absoluteUrl('/news'), changefreq: 'hourly', priority: 0.9 },
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ loc: absoluteUrl(`/news/${c.slug}`), changefreq: 'daily', priority: 0.7 })),
    ]
  }
  if (type === 'news') {
    return (await getNewsForSitemap())
      .filter((a) => a.slug && a.category?.slug)
      .map((a) => ({
        loc: absoluteUrl(articlePath(a.category.slug as string, a.slug as string)),
        lastmod: new Date(a.updatedAt).toISOString(),
        priority: 0.8,
      }))
  }
  return (await getPagesForSitemap())
    .filter((p) => p.slug)
    .map((p) => ({ loc: absoluteUrl(`/${p.slug}`), lastmod: new Date(p.updatedAt).toISOString(), priority: 0.4 }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const name = type.replace(/\.xml$/, '') as SitemapType
  if (!type.endsWith('.xml') || !SITEMAP_TYPES.includes(name)) notFound()
  return xml(urlset(await entries(name)))
}
