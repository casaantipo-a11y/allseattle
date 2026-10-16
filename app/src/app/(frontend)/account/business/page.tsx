import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ContactEmail } from '@/components/ContactEmail'
import { getCustomer } from '@/lib/account'
import { bizPath, effectivePackage } from '@/lib/business'
import { MAX_BUSINESSES, myBusinesses } from '@/lib/business-cabinet'
import { mediaUrl } from '@/lib/media'
import { SITE_TZ } from '@/lib/site'
import type { Media, Package } from '@/payload-types'

export const metadata: Metadata = { title: 'My business' }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE_TZ })

const STATE = {
  published: { label: 'Live', tone: 'text-[#2f855a]' },
  pending: { label: 'Pending review', tone: 'text-[#b7791f]' },
  rejected: { label: 'Not approved', tone: 'text-[#c53030]' },
  draft: { label: 'Hidden', tone: 'text-brand-slate' },
} as const

// "My business" (stage 3, step 3): the businesses this account manages, with
// their status and package, and the way to register one.
export default async function MyBusinessPage() {
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent('/account/business')}`)
  const businesses = await myBusinesses(me.id)
  const canAdd = businesses.filter((b) => b.status !== 'rejected').length < MAX_BUSINESSES

  return (
    <AccountShell
      eyebrow="Your account"
      title="My business"
      wide
      intro={
        <>
          Your page in the business directory and on the city map.{' '}
          <Link href="/account" className="text-brand-navy underline">
            Back to the account
          </Link>
        </>
      }
    >
      {canAdd ? (
        <div className="mb-6">
          <Link href="/account/business/new" className="btn">
            Register a business
          </Link>
        </div>
      ) : null}
      {businesses.length === 0 ? (
        <div className="m-0 text-brand-slate">No businesses yet.</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {businesses.map((b) => {
            const s = STATE[b.status]
            const pkg = effectivePackage({ package: b.package as Package | null, packageExpiresAt: b.packageExpiresAt })
            const logo = mediaUrl((b.logo ?? b.cover) as Media | number | null, 'thumb')
            return (
              <li key={b.id} className="flex gap-4 border-t border-brand-line py-4 first:border-t-0 first:pt-0 last:pb-0">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-28" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <h3>{b.name}</h3>
                  <div className="m-0 mt-1 text-sm">
                    <span className={`font-semibold ${s.tone}`}>{s.label}</span>
                    <span className="text-brand-slate">
                      {' '}
                      · {pkg ? `${pkg.name} package${b.packageExpiresAt ? ` until ${day(b.packageExpiresAt)}` : ''}` : 'Basic listing'}
                      {b.subscriptionStatus === 'active' ? ' · renews monthly' : b.subscriptionStatus === 'past_due' ? ' · payment failed' : ''}
                    </span>
                  </div>
                  {b.status === 'rejected' && b.moderationNote ? <div className="m-0 mt-1 text-sm">Reason: {b.moderationNote}</div> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {b.status === 'published' ? (
                      <Link href={bizPath(b.slug)} className="btn btn-sm">
                        View
                      </Link>
                    ) : null}
                    <Link href={`/account/business/${b.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <Link href={`/account/business/${b.id}/offers`} className="btn btn-outline btn-sm">
                      Promotions &amp; products
                    </Link>
                    <Link href={`/account/business/${b.id}/package`} className="btn btn-outline btn-sm">
                      Package
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {/* 16px above and under the rule, as on /account/ads (client, 16.10.2026). */}
      <div className="account-note mt-4 border-t border-brand-line pt-4 text-brand-slate">
        <div className="m-0">
          Already in the directory? Write to us from <strong>{me.email}</strong> with the name of your business, and we will connect it to
          this account.
        </div>
        <ContactEmail label="Our email:" />
      </div>
    </AccountShell>
  )
}
