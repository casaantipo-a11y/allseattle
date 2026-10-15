import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountShell } from '@/components/account/AccountShell'
import { ListingActions } from '@/components/account/ListingActions'
import { getCustomer } from '@/lib/account'
import { ACTIVE_LIMIT, myListings } from '@/lib/listings'
import { mediaUrl } from '@/lib/media'
import { SITE_TZ } from '@/lib/site'
import type { CarListing, Job, Media } from '@/payload-types'

export const metadata: Metadata = { title: 'My listings' }

type Row = { kind: 'car' | 'job'; doc: CarListing | Job }
type Action = 'hide' | 'show' | 'renew' | 'delete'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE_TZ })

/** What the author sees: the moderation status, with "Expired" over a live one. */
function stateOf(doc: CarListing | Job) {
  const expired = Boolean(doc.expiresAt && new Date(doc.expiresAt) <= new Date())
  if (doc.status === 'published') return expired ? { label: 'Expired', tone: 'text-brand-slate' } : { label: 'Live', tone: 'text-[#2f855a]' }
  if (doc.status === 'pending') return { label: 'Pending review', tone: 'text-[#b7791f]' }
  if (doc.status === 'rejected') return { label: 'Not approved', tone: 'text-[#c53030]' }
  return { label: 'Hidden', tone: 'text-brand-slate' }
}

// "My listings" of a site account (stage 3, step 2): every car and job it sent,
// with the moderation status and the actions allowed in that status.
export default async function MyListingsPage() {
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent('/account/listings')}`)
  const { cars, jobs } = await myListings(me.id)
  const rows: Row[] = [...cars.map((doc) => ({ kind: 'car' as const, doc })), ...jobs.map((doc) => ({ kind: 'job' as const, doc }))].sort((a, b) =>
    b.doc.updatedAt.localeCompare(a.doc.updatedAt),
  )

  return (
    <AccountShell
      eyebrow="Your account"
      title="My listings"
      wide
      intro={
        <>
          Up to {ACTIVE_LIMIT} listings can be live or waiting for review at once. Each stays up for 30 days.{' '}
          <Link href="/account" className="text-brand-navy underline">
            Back to the account
          </Link>
        </>
      }
    >
      {/* Centred in the card (client, 15.10.2026), and the empty-state line under them with it. */}
      <div className="mb-6 flex flex-wrap justify-center gap-3">
        <Link href="/account/listings/new?type=car" className="btn">
          Sell a car
        </Link>
        <Link href="/account/listings/new?type=job" className="btn btn-outline">
          Post a job
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="m-0 text-center text-brand-slate">No listings yet.</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {rows.map(({ kind, doc }) => {
            const s = stateOf(doc)
            const live = s.label === 'Live'
            const cover = kind === 'car' ? ((doc as CarListing).photos?.[0] as Media | number | undefined) : undefined
            const photo = mediaUrl(cover, 'thumb')
            const actions: Action[] = [
              ...(doc.status === 'published' || doc.status === 'pending' ? (['hide'] as const) : []),
              ...(doc.status === 'draft' ? (['show'] as const) : []),
              ...(doc.status === 'published' ? (['renew'] as const) : []),
              'delete',
            ]
            return (
              <li key={`${kind}${doc.id}`} className="flex gap-4 border-t border-brand-line py-5 first:border-t-0 first:pt-0">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-28" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="eyebrow">{kind === 'car' ? 'Car' : 'Job'}</span>
                  <h3>{doc.title}</h3>
                  <div className="m-0 mt-1 text-sm">
                    <span className={`font-semibold ${s.tone}`}>{s.label}</span>
                    {doc.status === 'published' && doc.expiresAt ? (
                      <span className="text-brand-slate">
                        {' '}
                        · {live ? 'until' : 'ended'} {day(doc.expiresAt)}
                      </span>
                    ) : null}
                    <span className="text-brand-slate"> · {doc.viewsCount ?? 0} views</span>
                  </div>
                  {doc.status === 'rejected' && doc.moderationNote ? <div className="m-0 mt-1 text-sm">Reason: {doc.moderationNote}</div> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {live ? (
                      <Link href={kind === 'car' ? `/cars/${doc.slug}` : `/jobs/${doc.slug}`} className="btn btn-sm">
                        View
                      </Link>
                    ) : null}
                    <Link href={`/account/listings/${kind}/${doc.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <ListingActions kind={kind} id={doc.id} actions={actions} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </AccountShell>
  )
}
