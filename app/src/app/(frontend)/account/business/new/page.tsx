import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { BusinessForm } from '@/components/account/BusinessForm'
import { packageFor } from '@/hooks/packageLimits'
import { getCustomer } from '@/lib/account'
import { MAX_BUSINESSES, categoryOptions, myBusinesses } from '@/lib/business-cabinet'
import { payloadClient } from '@/lib/cabinet'
import { getBusinessCategories } from '@/lib/queries'

export const metadata: Metadata = { title: 'Register a business' }

// Registering a business from the account (stage 3, step 3). A new business has
// no package yet, so the cheapest package's limits apply until one is bought.
export default async function NewBusinessPage() {
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent('/account/business/new')}`)
  const mine = await myBusinesses(me.id)
  if (mine.filter((b) => b.status !== 'rejected').length >= MAX_BUSINESSES) redirect('/account/business')
  const [categories, pkg] = await Promise.all([getBusinessCategories(), payloadClient().then((p) => packageFor(p, null))])
  return (
    <AccountShell
      eyebrow="My business"
      title="Register a business"
      wide
      intro={
        <>
          Free basic listing in the directory and on the city map. More categories, photos and products come with a{' '}
          <Link href="/advertise" className="text-brand-navy underline">
            package
          </Link>
          .
        </>
      }
    >
      <BusinessForm
        values={{ phone: me.phone ?? '', email: me.email }}
        categories={categoryOptions(categories)}
        limits={{ packageName: pkg?.name ?? 'the basic listing', maxCategories: pkg?.maxCategories ?? 2, maxPhotos: pkg?.maxPhotos ?? 10 }}
      />
    </AccountShell>
  )
}
