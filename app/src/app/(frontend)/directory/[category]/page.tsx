import { permanentRedirect } from 'next/navigation'

import { OLD_DIRECTORY_SLUGS } from '@/lib/directory-tree'
import { getBusinessCategories } from '@/lib/queries'

import { sectionMetadata, sectionPage } from '../sectionPage'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }

// Rendered on demand, like the section page itself: the page reads ?q and ?page. With
// generateStaticParams it was a static route, and every category not built ahead (all but those
// with businesses) answered 500 DYNAMIC_SERVER_USAGE on production (found 21.10.2026); the built
// ones ignored ?page and ?q. Data reads stay cached (unstable_cache in lib/queries).

export const generateMetadata = ({ params, searchParams }: Props) => sectionMetadata('directory', searchParams, params)

export default async function Page({ params, searchParams }: Props) {
  // The old flat headings (before the 13-section tree, 12.10.2026) answer 308 to
  // their new category, so links and bookmarks keep working.
  const { category } = await params
  const moved = OLD_DIRECTORY_SLUGS[category]
  if (moved && moved !== category) {
    const exists = (await getBusinessCategories()).some((c) => c.slug === category && c.section === 'directory')
    if (!exists) permanentRedirect(`/directory/${moved}`)
  }
  return sectionPage('directory', searchParams, params)
}
