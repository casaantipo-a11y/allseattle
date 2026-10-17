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
  if (doc.status === 'published') return expired ? { label: 'Expired', tone: 'is-muted' } : { label: 'Live', tone: 'is-live' }
  if (doc.status === 'pending') return { label: 'Pending review', tone: 'is-pending' }
  if (doc.status === 'rejected') return { label: 'Not approved', tone: 'is-rejected' }
  return { label: 'Hidden', tone: 'is-muted' }
}

const ICON_PROPS = { viewBox: '0 0 24 24', width: 26, height: 26, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
// The tile of a row without a photo: a car (as on Cars' "Place a listing") or a briefcase.
const KindIcon = ({ kind }: { kind: 'car' | 'job' }) =>
  kind === 'car' ? (
    <svg {...ICON_PROPS}>
      <path d="M5 17h14M5 17a2 2 0 1 1-4 0v-4l2-5h18l2 5v4a2 2 0 1 1-4 0" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ) : (
    <svg {...ICON_PROPS}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </svg>
  )

// "My listings" of a site account (stage 3, step 2): every car and job it sent,
// with the moderation status and the actions allowed in that status.
export default async function MyListingsPage() {
  const me = await getCustomer()
  if (!me) redirect(`/account/login?next=${encodeURIComponent('/account/listings')}`)
  const { cars, jobs } = await myListings(me.id)
  const rows: Row[] = [...cars.map((doc) => ({ kind: 'car' as const, doc })), ...jobs.map((doc) => ({ kind: 'job' as const, doc }))].sort((a, b) =>
    b.doc.updatedAt.localeCompare(a.doc.updatedAt),
  )
  // what counts against the limit, as lib/listings activeCount: pending or live, not expired
  const active = rows.filter(({ doc }) => (doc.status === 'pending' || doc.status === 'published') && !(doc.expiresAt && new Date(doc.expiresAt) <= new Date())).length

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
      {rows.length === 0 ? (
        <>
          {/* Nothing yet: the two buttons centred, the line under them (client, 15.10.2026). */}
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            <Link href="/account/listings/new?type=car" className="btn">
              Sell a car
            </Link>
            <Link href="/account/listings/new?type=job" className="btn btn-outline">
              Post a job
            </Link>
          </div>
          <div className="m-0 text-center text-brand-slate">No listings yet.</div>
        </>
      ) : (
        <>
          {/* With listings: a toolbar (count left, buttons right) and even rows — every row has
              the same thumbnail slot, status as a badge, actions on the right from 1024
              (client, 16.10.2026: "looks untidy"). Styles: .listings-* in business.css. */}
          <div className="listings-toolbar">
            <div className="listings-toolbar-count">
              {active} of {ACTIVE_LIMIT} active
            </div>
            <div className="listings-toolbar-actions">
              <Link href="/account/listings/new?type=car" className="btn btn-sm">
                Sell a car
              </Link>
              <Link href="/account/listings/new?type=job" className="btn btn-outline btn-sm">
                Post a job
              </Link>
            </div>
          </div>
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
                <li key={`${kind}${doc.id}`} className="listing-row">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="listing-row-thumb" />
                  ) : (
                    <span className="listing-row-thumb" aria-hidden="true">
                      <KindIcon kind={kind} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="listing-row-title">{doc.title}</h3>
                    <div className="listing-row-meta">
                      <span className={`listing-status ${s.tone}`}>{s.label}</span>
                      <span>
                        {kind === 'car' ? 'Car' : 'Job'}
                        {doc.status === 'published' && doc.expiresAt ? ` · ${live ? 'until' : 'ended'} ${day(doc.expiresAt)}` : ''} · {doc.viewsCount ?? 0} views
                      </span>
                    </div>
                    {doc.status === 'rejected' && doc.moderationNote ? <div className="listing-row-note">Reason: {doc.moderationNote}</div> : null}
                  </div>
                  <div className="listing-row-actions account-actions">
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
                </li>
              )
            })}
          </ul>
        </>
      )}
    </AccountShell>
  )
}
