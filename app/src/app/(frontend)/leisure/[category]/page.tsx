import { sectionMetadata, sectionPage } from '../../directory/sectionPage'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }

// Rendered on demand, like the section page itself: the page reads ?q and ?page. With
// generateStaticParams it was a static route, and every category not built ahead (all but those
// with businesses) answered 500 DYNAMIC_SERVER_USAGE on production (found 21.10.2026); the built
// ones ignored ?page and ?q. Data reads stay cached (unstable_cache in lib/queries).

export const generateMetadata = ({ params, searchParams }: Props) => sectionMetadata('leisure', searchParams, params)

export default function Page({ params, searchParams }: Props) {
  return sectionPage('leisure', searchParams, params)
}
