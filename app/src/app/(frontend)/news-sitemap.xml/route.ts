import { getNewsForSitemap, getSiteSettings } from '@/lib/queries'
import { absoluteUrl, articlePath } from '@/lib/site'
import { newsUrlset, xml } from '@/lib/sitemap'

export const revalidate = 600

// Google News sitemap: only articles published in the last 48 hours, as the
// format requires (at most 1000 URLs).
export async function GET() {
  const since = Date.now() - 48 * 3600 * 1000
  const [articles, settings] = await Promise.all([getNewsForSitemap(), getSiteSettings()])
  const recent = articles
    .filter((a) => a.slug && a.category?.slug && new Date(a.publishedAt).getTime() >= since)
    .slice(0, 1000)
    .map((a) => ({
      loc: absoluteUrl(articlePath(a.category.slug as string, a.slug as string)),
      title: a.title,
      publishedAt: a.publishedAt,
    }))
  return xml(newsUrlset(recent, settings.siteName || 'AllSeattle'))
}
