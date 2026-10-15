import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ManageBilling } from '@/components/account/PackagePicker'
import { getCustomer } from '@/lib/account'
import { myAds } from '@/lib/ad-billing'
import { mediaUrl } from '@/lib/media'
import { SITE_TZ } from '@/lib/site'
import type { AdSlot, Banner, Media } from '@/payload-types'

export const metadata: Metadata = { title: 'My ads' }

type Props = { searchParams: Promise<{ paid?: string }> }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE_TZ })

function stateOf(b: Banner, now = new Date()) {
  if (new Date(b.endAt) <= now || b.subscriptionStatus === 'canceled') return { label: 'Ended', tone: 'text-brand-slate' }
  if (b.status === 'published') return { label: `Live until ${day(b.endAt)}`, tone: 'text-[#2f855a]' }
  if (b.status === 'pending') return { label: 'In review', tone: 'text-[#b7791f]' }
  if (b.status === 'rejected') return { label: 'Not approved', tone: 'text-[#c53030]' }
  return { label: b.imageDesktop ? 'Hidden' : 'Waiting for your picture', tone: 'text-[#b7791f]' }
}

// "My ads" (stage 3, step 5): banner places the account bought online — status,
// impressions and clicks, the picture upload and billing.
export default async function MyAdsPage({ searchParams }: Props) {
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent('/account/ads')}`)
  const ads = await myAds(me.id)
  const paid = (await searchParams).paid === '1'

  return (
    <AccountShell
      eyebrow="Your account"
      title="My ads"
      wide
      intro={
        <>
          Banner places you bought on AllSeattle.{' '}
          <Link href="/advertise#placements" className="text-brand-navy underline">
            See free places and prices
          </Link>{' '}
          ·{' '}
          <Link href="/account" className="text-brand-navy underline">
            Back to the account
          </Link>
        </>
      }
    >
      {paid ? (
        <div className="success-panel mb-6" role="status">
          <div>Payment received — thank you! Your place appears here within a minute (refresh the page); then upload the banner picture.</div>
        </div>
      ) : null}
      {ads.length === 0 ? (
        <div className="text-brand-slate">No banner places yet.</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {ads.map(({ banner: b, stats }) => {
            const s = stateOf(b)
            const slot = (b.slots ?? []).find((x) => typeof x === 'object') as AdSlot | undefined
            const img = mediaUrl(b.imageDesktop as Media | null, 'thumb')
            const ctr = stats.impressions ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : null
            return (
              <li key={b.id} className="flex gap-4 border-t border-brand-line py-5 first:border-t-0 first:pt-0 last:pb-0">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-16 w-28 shrink-0 rounded-lg object-contain" style={{ background: '#f7f8fa' }} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="eyebrow">{slot?.name ?? 'Banner'}</span>
                  <h3>{b.advertiser}</h3>
                  <div className="text-sm">
                    <span className={`font-semibold ${s.tone}`}>{s.label}</span>
                    {b.subscriptionStatus === 'canceling' ? <span className="text-brand-slate"> · cancelled, won’t renew</span> : null}
                    {b.subscriptionStatus === 'past_due' ? <span className="text-[#c53030]"> · payment failed — check your card</span> : null}
                    <span className="text-brand-slate">
                      {' '}
                      · {stats.impressions.toLocaleString('en-US')} views · {stats.clicks.toLocaleString('en-US')} clicks{ctr ? ` (${ctr}%)` : ''}
                    </span>
                  </div>
                  {b.status === 'rejected' && b.moderationNote ? <div className="mt-1 text-sm">Reason: {b.moderationNote}</div> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link href={`/account/ads/${b.id}`} className="btn btn-outline btn-sm">
                      {b.imageDesktop ? 'Change the banner' : 'Upload the picture'}
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {me.stripeCustomerId ? (
        // 24px above the rule, under it and under the button (client, 15.10.2026): the last row
        // has no bottom padding, and from sm the card's 32px padding gives 8 back.
        <div className="mt-6 border-t border-brand-line pt-6 sm:-mb-2">
          <div className="mb-3 text-brand-slate">Cancel a place, change the card or download receipts:</div>
          <ManageBilling returnPath="/account/ads" />
        </div>
      ) : null}
    </AccountShell>
  )
}
