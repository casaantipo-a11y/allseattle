import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountForm, LogoutButton } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'
import { DeleteAccount } from '@/components/account/DeleteAccount'
import { getCustomer } from '@/lib/account'
import { myAds } from '@/lib/ad-billing'
import { myBusinesses } from '@/lib/business-cabinet'
import { payloadClient } from '@/lib/cabinet'
import { activeCount } from '@/lib/listings'

export const metadata: Metadata = { title: 'Your account' }

// The account home (stage 3): My listings, My business, My ads and the profile.
export default async function AccountPage() {
  const me = await getCustomer()
  if (!me) redirect('/account/login')
  const [active, businesses, ads] = await Promise.all([payloadClient().then((p) => activeCount(p, me.id)), myBusinesses(me.id), myAds(me.id)])
  return (
    <AccountShell eyebrow="Your account" title={`Hello, ${me.name}`} intro={<span>Signed in as {me.email}</span>}>
      <div className="mb-8 border-b border-brand-line pb-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 style={{ margin: 0 }}>My listings</h2>
          <Link href="/account/listings" className="btn btn-outline btn-sm">
            Open
          </Link>
        </div>
        <div className="m-0 text-brand-slate">
          {active ? `${active} live or waiting for review.` : 'No live listings.'}{' '}
          <Link href="/account/listings/new?type=car" className="text-brand-navy underline">
            Sell a car
          </Link>{' '}
          or{' '}
          <Link href="/account/listings/new?type=job" className="text-brand-navy underline">
            post a job
          </Link>
          .
        </div>
      </div>
      <div className="mb-8 border-b border-brand-line pb-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 style={{ margin: 0 }}>My business</h2>
          <Link href="/account/business" className="btn btn-outline btn-sm">
            Open
          </Link>
        </div>
        <div className="m-0 text-brand-slate">
          {businesses.length ? businesses.map((b) => b.name).join(', ') : 'Your page in the directory and on the city map.'}{' '}
          {businesses.length ? null : (
            <Link href="/account/business/new" className="text-brand-navy underline">
              Register a business
            </Link>
          )}
        </div>
      </div>
      <div className="mb-8 border-b border-brand-line pb-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 style={{ margin: 0 }}>My ads</h2>
          <Link href="/account/ads" className="btn btn-outline btn-sm">
            Open
          </Link>
        </div>
        <div className="text-brand-slate">
          {ads.length ? `${ads.length} banner ${ads.length === 1 ? 'place' : 'places'}.` : 'Banner places on the site, by the month.'}{' '}
          <Link href="/advertise#placements" className="text-brand-navy underline">
            See places and prices
          </Link>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 style={{ margin: 0 }}>Profile</h2>
        <LogoutButton />
      </div>
      <AccountForm mode="profile" customerId={me.id} values={{ name: me.name ?? '', phone: me.phone ?? '' }} />
      <div className="mt-8 border-t border-brand-line pt-6">
        <DeleteAccount />
      </div>
    </AccountShell>
  )
}
