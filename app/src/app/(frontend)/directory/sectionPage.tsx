import type { Metadata } from 'next'

import type { Section } from '@/collections/BusinessCategories'
import { getBusinessCategories } from '@/lib/queries'
import { seoDescription, seoTitle } from '@/lib/seo-texts'

import { BusinessSection, SECTION_META } from './BusinessSection'

// Route helpers shared by /directory, /shopping and /leisure (and their
// /[category] pages), so the six route files stay one-liners.

type SP = Promise<{ q?: string; page?: string }>
type CP = Promise<{ category: string }>

const CATEGORY_LINE: Record<Section, string> = {
  directory: 'local businesses with addresses, hours, photos, contacts and a map in the AllSeattle business directory.',
  shopping: 'local shops and stores with addresses, hours, photos and current deals on AllSeattle.',
  leisure: 'places to go with addresses, hours, photos and contacts on AllSeattle.',
}

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
  const all = await getBusinessCategories()
  const category = slug ? all.find((c) => c.slug === slug && c.section === section) : undefined
  if (slug && !category) return { title: 'Not found', robots: { index: false } }
  const path = category ? `${meta.base}/${category.slug}` : meta.base
  // Every category page gets its own title and description (SEO check 21.10.2026: 118 category
  // pages shared the section's description; two "Entertainment Centers" shared a title). A name
  // used twice in the section takes its parent's name; a category without its own description
  // gets one built from its name.
  const parentName = () => {
    const pid = typeof category?.parent === 'object' ? category?.parent?.id : category?.parent
    return all.find((c) => c.id === pid)?.name
  }
  const twin = category && all.some((c) => c.section === section && c.id !== category.id && c.name === category.name)
  const name = category ? (twin && parentName() ? `${category.name} (${parentName()})` : category.name) : ''
  const title = category ? `${name} in Seattle` : meta.title
  return {
    title: page > 1 ? `${title} — page ${page}` : category || sp.q ? title : await seoTitle(section, title),
    description: category
      ? category.description || `${name} in Seattle: ${CATEGORY_LINE[section]}`
      : await seoDescription(section, DESCRIPTIONS[section]),
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
