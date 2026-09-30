import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { bizPath } from '@/lib/business'
import { mediaUrl } from '@/lib/media'
import { findBusinessByOldSlug, getAllBusinesses, getBusiness } from '@/lib/queries'

import { BusinessView } from '../BusinessView'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAllBusinesses()).filter((b) => b.slug).map((b) => ({ slug: b.slug as string }))
}

type Meta = { title?: string | null; description?: string | null; image?: unknown }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const biz = await getBusiness(slug)
  if (!biz) return { title: 'Not found', robots: { index: false } }
  const meta = (biz as unknown as { meta?: Meta }).meta ?? {}
  const cats = (biz.categories ?? []).map((c) => (typeof c === 'object' ? c.name : '')).filter(Boolean)
  const title = meta.title?.replace(/\s*\|\s*AllSeattle$/, '') || `${biz.name}${cats[0] ? ` — ${cats[0]} in Seattle` : ''}`
  const description =
    meta.description || biz.summary || `${biz.name}${biz.address ? `, ${biz.address}` : ''}. Contacts, hours and map on AllSeattle.`
  const custom = mediaUrl((meta.image ?? null) as never, 'hero')
  return {
    title,
    description,
    // Always the main-domain path, also when the page is served on a subdomain (spec §5).
    alternates: { canonical: bizPath(biz.slug) },
    openGraph: { type: 'website', title, description, url: bizPath(biz.slug), ...(custom ? { images: [{ url: custom }] } : {}) },
  }
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params
  const biz = await getBusiness(slug)
  if (!biz) {
    const moved = await findBusinessByOldSlug(slug)
    if (moved?.slug) permanentRedirect(bizPath(moved.slug))
    notFound()
  }
  return <BusinessView biz={biz} />
}
