import type { Metadata } from 'next'

import { getNewsCategories } from '@/lib/queries'

import { NewsSection } from '../NewsSection'

export const revalidate = 3600

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string }> }

export async function generateStaticParams() {
  return (await getNewsCategories()).filter((c) => c.slug).map((c) => ({ category: c.slug as string }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const page = Number((await searchParams).page) || 1
  const category = (await getNewsCategories()).find((c) => c.slug === slug)
  if (!category) return { title: 'Not found', robots: { index: false } }
  const canonical = page > 1 ? `/news/${slug}?page=${page}` : `/news/${slug}`
  return {
    title: page > 1 ? `${category.name} news — page ${page}` : `${category.name} news`,
    description: category.description || `Seattle ${category.name.toLowerCase()} news on AllSeattle.`,
    alternates: { canonical },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const page = Math.max(1, Number((await searchParams).page) || 1)
  return <NewsSection page={page} categorySlug={category} />
}
