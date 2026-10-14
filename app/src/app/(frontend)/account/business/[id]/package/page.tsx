import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ManageBilling, PackagePicker } from '@/components/account/PackagePicker'
import { ContactEmail } from '@/components/ContactEmail'
import { getCustomer } from '@/lib/account'
import { effectivePackage, priceText } from '@/lib/business'
import { myBusiness } from '@/lib/business-cabinet'
import { relId } from '@/lib/cabinet'
import { getPackages } from '@/lib/queries'
import { SITE_TZ } from '@/lib/site'
import { stripeEnabled } from '@/lib/stripe'
import type { Package } from '@/payload-types'

export const metadata: Metadata = { title: 'Package' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: SITE_TZ })

const STATUS: Record<string, string> = {
  active: 'Renews every month.',
  canceling: 'Cancelled — it won’t renew.',
  past_due: 'The last payment failed. Stripe is retrying — please check your card in “Manage billing”.',
  canceled: 'The subscription has ended.',
}

// A business's package in the account (stage 3, step 4): what it has now and,
// with online payment on, buying one through Stripe or managing the subscription.
export default async function BusinessPackagePage({ params, searchParams }: Props) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent(`/account/business/${id}/package`)}`)
  const [mine, packages] = await Promise.all([myBusiness(me, Number(id)), getPackages()])
  if (!mine) notFound()
  const { biz } = mine
  const paid = (await searchParams).paid === '1'
  const now = effectivePackage({ package: biz.package as Package | null, packageExpiresAt: biz.packageExpiresAt })
  const sub = biz.subscriptionStatus
  const subscribed = sub === 'active' || sub === 'canceling' || sub === 'past_due'
  const returnPath = `/account/business/${biz.id}/package`

  return (
    <AccountShell
      eyebrow={biz.name}
      title="Package"
      wide
      intro={
        <>
          What your listing gets: categories, photos, products, priority in the directory.{' '}
          <Link href="/account/business" className="text-brand-navy underline">
            Back to my business
          </Link>
        </>
      }
    >
      {paid && !subscribed ? (
        <div className="success-panel mb-6" role="status">
          <div>Payment received — thank you! The package turns on within a minute; refresh this page to see it.</div>
        </div>
      ) : null}

      <h2>Now</h2>
      <div className="mb-8">
        {now ? (
          <>
            <strong>{now.name}</strong>
            {biz.packageExpiresAt ? ` · ${sub === 'active' ? 'paid until' : 'until'} ${day(biz.packageExpiresAt)}` : ''}
          </>
        ) : (
          'Basic listing (no package).'
        )}
        {sub ? <div className="mt-1 text-brand-slate">{STATUS[sub]}</div> : null}
      </div>

      {subscribed ? (
        <>
          <div className="mb-4">Change the card, download receipts or cancel the subscription:</div>
          <ManageBilling returnPath={returnPath} />
          <div className="mt-6 text-brand-slate">To switch to another package, cancel this one or write to us — we’ll move it over.</div>
        </>
      ) : !stripeEnabled() ? (
        <div className="text-brand-slate">
          <div>Online payment opens soon. To get a package now, write to us with the name of your business.</div>
          <ContactEmail label="Our email:" className="mt-2" />
        </div>
      ) : biz.status === 'rejected' ? (
        <div>This business was not approved. Edit it and send it for review first.</div>
      ) : (
        <>
          <h2>Choose a package</h2>
          <PackagePicker
            businessId={biz.id}
            packages={packages.map((p) => ({
              id: p.id,
              name: p.name,
              priceMonthly: p.priceMonthly,
              price: p.priceMonthly > 0 ? `${priceText(p.priceMonthly, p.currency ?? 'USD')}/month` : 'Contact us',
              features: (p.features ?? []).map((f) => f.text),
              current: relId(now) === p.id,
            }))}
          />
          <div className="mt-6 text-sm text-brand-slate">
            Payment is handled by Stripe; we never see your card. Questions about packages?{' '}
            <Link href="/advertise" className="text-brand-navy underline">
              Compare packages
            </Link>
          </div>
        </>
      )}
    </AccountShell>
  )
}
