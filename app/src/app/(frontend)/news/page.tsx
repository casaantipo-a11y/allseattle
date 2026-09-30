import type { Metadata } from 'next'

import { NewsSection } from './NewsSection'

export const revalidate = 3600

type Props = { searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = Number((await searchParams).page) || 1
  return {
    title: page > 1 ? `Seattle news — page ${page}` : 'Seattle news',
    description: 'The latest news from Seattle: city hall, transit, business, food, community and more.',
    alternates: { canonical: page > 1 ? `/news?page=${page}` : '/news' },
  }
}

export default async function NewsIndex({ searchParams }: Props) {
  const page = Math.max(1, Number((await searchParams).page) || 1)
  return <NewsSection page={page} />
}
