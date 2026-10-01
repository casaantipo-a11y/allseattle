import { notFound } from 'next/navigation'

import { bizPath } from '@/lib/business'
import {
  getAllBusinesses,
  getBusinessCategories,
  getNewsCategories,
  getNewsForSitemap,
  getPagesForSitemap,
} from '@/lib/queries'
import { getCars, getContestsForSitemap, getJobs, getUpcomingEvents } from '@/lib/queries-phase3'
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
      ...['/directory', '/shopping', '/leisure', '/map', '/advertise', '/add-business', '/cars', '/jobs', '/events', '/weather', '/share-news'].map((path) => ({
        loc: absoluteUrl(path),
        changefreq: 'daily',
        priority: 0.8,
      })),
    ]
  }
  if (type === 'businesses') {
    const [businesses, categories] = await Promise.all([getAllBusinesses(), getBusinessCategories()])
    return [
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ loc: absoluteUrl(`/${c.section}/${c.slug}`), changefreq: 'daily', priority: 0.6 })),
      ...businesses
        .filter((b) => b.slug)
        .map((b) => ({ loc: absoluteUrl(bizPath(b.slug)), lastmod: new Date(b.updatedAt).toISOString(), priority: 0.7 })),
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
  const lastmod = (d: { updatedAt: string }) => new Date(d.updatedAt).toISOString()
  if (type === 'cars') return (await getCars()).filter((c) => c.slug).map((c) => ({ loc: absoluteUrl(`/cars/${c.slug}`), lastmod: lastmod(c), priority: 0.6 }))
  if (type === 'jobs') return (await getJobs()).filter((j) => j.slug).map((j) => ({ loc: absoluteUrl(`/jobs/${j.slug}`), lastmod: lastmod(j), priority: 0.6 }))
  if (type === 'events') {
    const [events, contests] = await Promise.all([getUpcomingEvents(), getContestsForSitemap()])
    return [
      ...events.filter((e) => e.slug).map((e) => ({ loc: absoluteUrl(`/events/${e.slug}`), lastmod: lastmod(e), priority: 0.6 })),
      ...contests.filter((c) => c.slug).map((c) => ({ loc: absoluteUrl(`/contests/${c.slug}`), lastmod: lastmod(c), priority: 0.5 })),
    ]
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
