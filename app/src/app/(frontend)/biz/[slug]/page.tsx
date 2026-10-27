import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { bizPath, bizUrl, effectivePackage } from '@/lib/business'
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
    // The business's subdomain when its package has one, else this path.
    alternates: { canonical: bizUrl(biz) },
    // A free listing's page is the name and the phone only: thin, so out of search engines.
    ...(effectivePackage(biz) ? {} : { robots: { index: false, follow: true } }),
    openGraph: { type: 'website', title, description, url: bizUrl(biz), ...(custom ? { images: [{ url: custom }] } : {}) },
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
  // A business with its own subdomain is shown there; this address only redirects.
  const url = bizUrl(biz)
  if (url !== bizPath(biz.slug)) permanentRedirect(url)
  return <BusinessView biz={biz} />
}
