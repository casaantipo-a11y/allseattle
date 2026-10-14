import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ListingForm } from '@/components/account/ListingForm'
import { getCustomer } from '@/lib/account'
import { ACTIVE_LIMIT, activeCount, payloadClient } from '@/lib/listings'
import { getCarMakes, getJobCategories } from '@/lib/queries-phase3'

export const metadata: Metadata = { title: 'New listing' }

type Props = { searchParams: Promise<{ type?: string }> }

// "Place a listing" (Cars) and "Post a job" (Jobs) land here (stage 3, step 2).
export default async function NewListingPage({ searchParams }: Props) {
  const kind = (await searchParams).type === 'job' ? 'job' : 'car'
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/listings/new?type=${kind}`)}`)
  const active = await activeCount(await payloadClient(), me.id)
  const title = kind === 'car' ? 'Sell your car' : 'Post a job'
  const other = kind === 'car' ? { href: '/account/listings/new?type=job', label: 'post a job' } : { href: '/account/listings/new?type=car', label: 'sell a car' }
  if (active >= ACTIVE_LIMIT) {
    return (
      <AccountShell eyebrow="My listings" title={title}>
        <p className="m-0">
          You already have {ACTIVE_LIMIT} live or waiting listings — the most an account can have at once. Hide or delete one in{' '}
          <Link href="/account/listings" className="text-brand-navy underline">
            My listings
          </Link>{' '}
          to add another.
        </p>
      </AccountShell>
    )
  }
  const [makes, categories] = kind === 'car' ? [await getCarMakes(), []] : [[], await getJobCategories()]
  return (
    <AccountShell
      eyebrow="My listings"
      title={title}
      wide
      intro={
        <>
          Free for private sellers: up to {ACTIVE_LIMIT} listings at a time. Or{' '}
          <Link href={other.href} className="text-brand-navy underline">
            {other.label}
          </Link>
          .
        </>
      }
    >
      <ListingForm
        kind={kind}
        values={kind === 'car' ? { sellerName: me.name ?? '', sellerPhone: me.phone ?? '' } : {}}
        makes={makes.map((m) => ({ id: m.id, name: m.name, models: m.models ?? [] }))}
        categories={categories.map((c) => ({ value: String(c.id), label: c.name }))}
      />
    </AccountShell>
  )
}
