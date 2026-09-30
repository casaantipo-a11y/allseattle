import { absoluteUrl } from '@/lib/site'
import { SITEMAP_TYPES, sitemapIndex, xml } from '@/lib/sitemap'

export const revalidate = 3600

// Sitemap index: one child sitemap per content type (spec §9). Types added in
// later phases (businesses, events, jobs, cars) join SITEMAP_TYPES.
export function GET() {
  return xml(sitemapIndex(SITEMAP_TYPES.map((t) => ({ loc: absoluteUrl(`/sitemaps/${t}.xml`) }))))
}
