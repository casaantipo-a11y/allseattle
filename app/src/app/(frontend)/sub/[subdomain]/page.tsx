import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { bizPath, effectivePackage } from '@/lib/business'
import { getBusinessBySubdomain } from '@/lib/queries'

import { BusinessView } from '../../biz/BusinessView'

// {subdomain}.{ROOT_DOMAIN} is rewritten here by src/proxy.ts (only with
// ENABLE_SUBDOMAINS=true). The page is the business page itself; its
// canonical stays /biz/{slug} on the main domain. A subdomain works only while
// the business's package includes one and hasn't expired.

export const revalidate = 3600

type Props = { params: Promise<{ subdomain: string }> }

async function load(subdomain: string) {
  const biz = await getBusinessBySubdomain(subdomain)
  if (!biz || !effectivePackage(biz)?.subdomain) return null
  return biz
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const biz = await load((await params).subdomain)
  if (!biz) return { title: 'Not found', robots: { index: false } }
  const main = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
  return { title: biz.name, description: biz.summary ?? undefined, alternates: { canonical: `${main}${bizPath(biz.slug)}` } }
}

export default async function SubdomainPage({ params }: Props) {
  const biz = await load((await params).subdomain)
  if (!biz) notFound()
  return <BusinessView biz={biz} />
}
