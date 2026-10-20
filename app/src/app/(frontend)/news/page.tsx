import type { Metadata } from 'next'

import { seoDescription, seoTitle } from '@/lib/seo-texts'

import { NewsSection, archiveParams } from './NewsSection'

export const revalidate = 3600

type Props = { searchParams: Promise<{ page?: string; month?: string; year?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const { month, year } = archiveParams(sp)
  return {
    title: page > 1 ? `Seattle news — page ${page}` : month || year ? 'Seattle news' : await seoTitle('news', 'Seattle news'),
    description: await seoDescription('news', 'The latest news from Seattle: city hall, transit, business, food, community and more.'),
    alternates: { canonical: page > 1 ? `/news?page=${page}` : '/news' },
    // Archive views are filters of this list, not pages of their own.
    ...(month || year ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function NewsIndex({ searchParams }: Props) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  return <NewsSection page={page} {...archiveParams(sp)} />
}
