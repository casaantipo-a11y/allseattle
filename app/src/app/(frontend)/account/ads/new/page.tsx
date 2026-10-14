import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { AdCheckoutForm } from '@/components/account/AdForms'
import { ContactEmail } from '@/components/ContactEmail'
import { getCustomer } from '@/lib/account'
import { slotByCode, slotTaken } from '@/lib/ad-billing'
import { PLACEMENT_GROUPS, priceLabel } from '@/lib/ad-placements'
import { payloadClient } from '@/lib/cabinet'
import { stripeEnabled } from '@/lib/stripe'
import type { AdSlot } from '@/payload-types'

export const metadata: Metadata = { title: 'Book a banner place' }

type Props = { searchParams: Promise<{ slot?: string }> }

// Booking a banner place (stage 3, step 5): "Available" on /advertise leads here.
export default async function NewAdPage({ searchParams }: Props) {
  const code = (await searchParams).slot ?? ''
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/ads/new?slot=${code}`)}`)
  const found = await slotByCode(code)
  if (!found) redirect('/advertise#placements')
  const { slot, placement } = found
  const group = PLACEMENT_GROUPS.find((g) => g.key === placement.group)
  const price = priceLabel(placement.price)

  if (!stripeEnabled()) {
    return (
      <AccountShell eyebrow="Advertising" title="Book a banner place">
        <div>Online booking opens soon. To book {slot.name ?? slot.code} now, write to us.</div>
        <ContactEmail label="Our email:" className="mt-2" />
      </AccountShell>
    )
  }

  // A position on the "other sections" sheet is one place per page: let the buyer pick the page.
  const payload = await payloadClient()
  const slots = (await payload.find({ collection: 'ad-slots', where: { code: { in: placement.codes } }, limit: 20, depth: 0 })).docs as AdSlot[]
  const options = await Promise.all(
    slots.filter((s) => s.isActive).map(async (s) => ({ value: s.code, label: s.name ?? s.code, taken: await slotTaken(s.id) })),
  )

  return (
    <AccountShell
      eyebrow="Advertising"
      title="Book a banner place"
      intro={
        <>
          <strong>
            {group?.label} · Block {placement.position}
          </strong>{' '}
          · {placement.size.replace('x', '×')} · shown on every visit · <strong>{price}</strong>.{' '}
          <Link href="/advertise#placements" className="text-brand-navy underline">
            Other places
          </Link>
        </>
      }
    >
      <AdCheckoutForm slots={options} chosen={slot.code} price={price} values={{ advertiser: '', linkUrl: '' }} />
    </AccountShell>
  )
}
