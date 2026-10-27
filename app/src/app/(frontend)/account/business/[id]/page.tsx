import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { BusinessForm } from '@/components/account/BusinessForm'
import type { Photo } from '@/components/account/photos'
import { getCustomer } from '@/lib/account'
import { effectivePackage } from '@/lib/business'
import { categoryOptions, myBusiness } from '@/lib/business-cabinet'
import { relId } from '@/lib/cabinet'
import { lexicalText } from '@/lib/jobs'
import { mediaUrl } from '@/lib/media'
import { getBusinessCategories } from '@/lib/queries'
import type { Media, Package } from '@/payload-types'

export const metadata: Metadata = { title: 'Edit business' }

type Props = { params: Promise<{ id: string }> }

const photos = (v: unknown): Photo[] =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((m: Media | number) => (typeof m === 'object' && m ? [{ id: m.id, url: mediaUrl(m, 'thumb') ?? '' }] : []))

// Editing a business the account manages (stage 3, step 3).
export default async function EditBusinessPage({ params }: Props) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/business/${id}`)}`)
  const [mine, categories] = await Promise.all([myBusiness(me, Number(id)), getBusinessCategories()])
  if (!mine) notFound()
  const { biz, pkg } = mine
  // Promotions and products show only on a paid business's page, so a free one has no link to them.
  const paid = Boolean(effectivePackage({ package: biz.package as Package | null, packageExpiresAt: biz.packageExpiresAt }))
  const s = biz.socials ?? {}
  const values: Record<string, string> = {
    name: biz.name,
    summary: biz.summary ?? '',
    description: lexicalText(biz.description),
    address: biz.address ?? '',
    phone: biz.phone ?? '',
    email: biz.email ?? '',
    website: biz.website ?? '',
    facebook: s.facebook ?? '',
    instagram: s.instagram ?? '',
    x: s.x ?? '',
    yelp: s.yelp ?? '',
  }
  return (
    <AccountShell
      eyebrow="My business"
      title={`Edit: ${biz.name}`}
      wide
      intro={
        <>
          {paid ? (
            <>
              <Link href={`/account/business/${biz.id}/offers`} className="text-brand-navy underline">
                Promotions &amp; products
              </Link>{' '}
              ·{' '}
            </>
          ) : null}
          <Link href="/account/business" className="text-brand-navy underline">
            Back to my business
          </Link>
        </>
      }
    >
      <BusinessForm
        id={biz.id}
        live={biz.status === 'published'}
        values={values}
        categories={categoryOptions(categories)}
        chosen={(biz.categories ?? []).map(relId).filter((x): x is number => x != null)}
        hours={(biz.hours ?? []).map((h) => ({ days: h.days, time: h.time }))}
        logo={photos(biz.logo)}
        cover={photos(biz.cover)}
        gallery={photos(biz.gallery)}
        limits={{ packageName: pkg?.name ?? 'the basic listing', maxCategories: pkg?.maxCategories ?? 2, maxPhotos: pkg?.maxPhotos ?? 10 }}
      />
    </AccountShell>
  )
}
