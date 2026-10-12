import type { Metadata } from 'next'

import { getNewsCategories } from '@/lib/queries'

import { NewsSection, archiveParams } from '../NewsSection'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string; month?: string; year?: string }> }

export async function generateStaticParams() {
  return (await getNewsCategories()).filter((c) => c.slug).map((c) => ({ category: c.slug as string }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const { month, year } = archiveParams(sp)
  const category = (await getNewsCategories()).find((c) => c.slug === slug)
  if (!category) return { title: 'Not found', robots: { index: false } }
  const canonical = page > 1 ? `/news/${slug}?page=${page}` : `/news/${slug}`
  return {
    title: page > 1 ? `${category.name} news — page ${page}` : `${category.name} news`,
    description: category.description || `Seattle ${category.name.toLowerCase()} news on AllSeattle.`,
    alternates: { canonical },
    ...(month || year ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  return <NewsSection page={page} categorySlug={category} {...archiveParams(sp)} />
}
