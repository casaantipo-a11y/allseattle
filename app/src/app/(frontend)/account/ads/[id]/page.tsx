import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { AdForm } from '@/components/account/AdForms'
import { getCustomer } from '@/lib/account'
import { myAd } from '@/lib/ad-billing'
import { mediaUrl } from '@/lib/media'
import type { AdSlot, Media } from '@/payload-types'

export const metadata: Metadata = { title: 'Banner' }

type Props = { params: Promise<{ id: string }> }

const photo = (m: unknown) => (typeof m === 'object' && m ? [{ id: (m as Media).id, url: mediaUrl(m as Media) ?? '' }] : [])

// The banner of a place bought online (stage 3, step 5): picture(s) at the
// slot's exact size, name and link; saving sends it to the team's review.
export default async function AdPage({ params }: Props) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/ads/${id}`)}`)
  const b = await myAd(me, Number(id))
  if (!b) notFound()
  const slot = (b.slots ?? []).find((x) => typeof x === 'object') as AdSlot | undefined
  if (!slot) notFound()
  return (
    <AccountShell
      eyebrow="My ads"
      title={slot.name ?? slot.code}
      intro={
        <Link href="/account/ads" className="text-brand-navy underline">
          Back to my ads
        </Link>
      }
    >
      <AdForm
        id={b.id}
        live={b.status === 'published'}
        values={{ advertiser: b.advertiser, linkUrl: b.linkUrl }}
        desktop={photo(b.imageDesktop)}
        mobile={photo(b.imageMobile)}
        desktopSize={slot.desktopSize}
        mobileSize={slot.mobileSize}
      />
    </AccountShell>
  )
}
