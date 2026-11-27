import { getNewsForSitemap, getSiteSettings } from '@/lib/queries'
import { absoluteUrl, articlePath } from '@/lib/site'
import { newsUrlset, xml } from '@/lib/sitemap'

export const revalidate = 600

// Google News sitemap: only articles published in the last 48 hours, as the
// format requires (at most 1000 URLs). A date still ahead of us is not a publication
// date yet (a paid article the team dated 1 January was listed on 27.11.2026), so it waits.
export async function GET() {
  const since = Date.now() - 48 * 3600 * 1000
  const until = Date.now() + 10 * 60 * 1000
  const [articles, settings] = await Promise.all([getNewsForSitemap(), getSiteSettings()])
  const recent = articles
    .filter((a) => {
      const t = new Date(a.publishedAt).getTime()
      return a.slug && a.category?.slug && t >= since && t <= until
    })
    .slice(0, 1000)
    .map((a) => ({
      loc: absoluteUrl(articlePath(a.category.slug as string, a.slug as string)),
      title: a.title,
      publishedAt: a.publishedAt,
    }))
  return xml(newsUrlset(recent, settings.siteName || 'AllSeattle'))
}
