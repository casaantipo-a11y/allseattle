import type { Metadata } from 'next'

import type { Section } from '@/collections/BusinessCategories'
import { getBusinessCategories } from '@/lib/queries'

import { BusinessSection, SECTION_META } from './BusinessSection'

// Route helpers shared by /directory, /shopping and /leisure (and their
// /[category] pages), so the six route files stay one-liners.

type SP = Promise<{ q?: string; page?: string }>
type CP = Promise<{ category: string }>

const DESCRIPTIONS: Record<Section, string> = {
  directory: 'Find Seattle businesses by category: contacts, hours, photos, promotions and a map.',
  shopping: 'Seattle shops and stores, with this week’s deals from local businesses.',
  leisure: 'Things to do in Seattle: cinemas, theaters, museums, live music, comedy and nightlife.',
}

export async function sectionMetadata(section: Section, searchParams: SP, params?: CP): Promise<Metadata> {
  const meta = SECTION_META[section]
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const slug = params ? (await params).category : undefined
  const category = slug
    ? (await getBusinessCategories()).find((c) => c.slug === slug && c.section === section)
    : undefined
  if (slug && !category) return { title: 'Not found', robots: { index: false } }
  const path = category ? `${meta.base}/${category.slug}` : meta.base
  const title = category ? `${category.name} in Seattle` : meta.title
  return {
    title: page > 1 ? `${title} — page ${page}` : title,
    description: category?.description || DESCRIPTIONS[section],
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
    // Search results are not pages of their own.
    ...(sp.q ? { robots: { index: false, follow: true } } : {}),
  }
}

export async function sectionPage(section: Section, searchParams: SP, params?: CP) {
  const sp = await searchParams
  const slug = params ? (await params).category : undefined
  return (
    <BusinessSection
      section={section}
      categorySlug={slug}
      q={typeof sp.q === 'string' ? sp.q : ''}
      page={Math.max(1, Number(sp.page) || 1)}
    />
  )
}

export async function sectionStaticParams(section: Section) {
  return (await getBusinessCategories())
    .filter((c) => c.section === section && c.slug)
    .map((c) => ({ category: c.slug as string }))
}
