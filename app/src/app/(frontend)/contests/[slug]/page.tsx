import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/RichText'
import { mediaUrl } from '@/lib/media'
import { getContest, getContestsForSitemap } from '@/lib/queries-phase3'
import type { Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getContestsForSitemap()).filter((c) => c.slug).map((c) => ({ slug: c.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getContest((await params).slug)
  if (!c) return { title: 'Not found', robots: { index: false } }
  return { title: c.title, description: c.description ?? undefined, alternates: { canonical: `/contests/${c.slug}` } }
}

const STATUS: Record<string, string> = { upcoming: 'Coming soon', active: 'Now open', finished: 'Finished' }
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null

// The prototype's contest page (contest.html, css: styles/contest.css) on real
// entries. No voting in this stage (spec §4): each card says so instead of a
// button. Participants appear by first name and age only.
export default async function ContestPage({ params }: Props) {
  const c = await getContest((await params).slug)
  if (!c) notFound()
  const entries = (c.entries ?? []).filter((e) => typeof e.image === 'object' && e.parentConsent)
  const dates = [fmt(c.startAt), fmt(c.endAt)].filter(Boolean).join(' – ')

  return (
    <main id="content" data-page="contest">
      <section className="section">
        <div className="container">
          <div className="contest-hero">
            <span className="eyebrow">AllSeattle community art contest</span>
            <h1>{c.title}</h1>
            {c.description ? <p className="muted max-w-[620px]">{c.description}</p> : null}
            <p className="m-0 text-sm font-semibold text-brand-navy">
              {STATUS[c.status]}
              {dates ? ` · ${dates}` : ''}
            </p>
            <Link href="/news" className="muted text-sm underline">
              &larr; Back to news
            </Link>
          </div>

          {entries.length ? (
            <div className="grid contest-grid">
              {entries.map((e) => {
                const img = e.image as Media
                return (
                  <article key={e.id ?? e.title} className="card contest-card">
                    <span className="contest-badge">Entry</span>
                    <div className="contest-card-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Payload rendition */}
                      <img src={mediaUrl(img, 'card') ?? ''} alt={`${e.title} — drawing by ${e.participantFirstName}, age ${e.participantAge}`} loading="lazy" />
                    </div>
                    <div className="contest-card-body">
                      <h3 className="mb-0.5">{e.title}</h3>
                      <p className="muted mb-0 text-sm">
                        by {e.participantFirstName}, age {e.participantAge}
                      </p>
                      <p className="mb-0 mt-3 rounded-full bg-[#f7f8fa] px-3 py-2 text-center text-sm font-semibold text-brand-slate">Voting opens soon</p>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="muted text-center">Entries will appear here soon.</p>
          )}

          {c.rules ? (
            <div className="mx-auto mt-12 max-w-[72ch]">
              <h2>Rules</h2>
              <RichText data={c.rules} />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
