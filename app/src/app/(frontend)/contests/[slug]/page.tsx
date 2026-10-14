import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ContestVoting } from '@/components/ContestVoting'
import { RichText } from '@/components/RichText'
import { getVoteCounts, votingState } from '@/lib/contest-votes'
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
// entries, with voting by email (stage 3, ContestVoting + lib/contest-votes.ts).
// Participants appear by first name and age only.
export default async function ContestPage({ params }: Props) {
  const c = await getContest((await params).slug)
  if (!c) notFound()
  const entries = (c.entries ?? []).filter((e) => typeof e.image === 'object' && e.parentConsent)
  const dates = [fmt(c.startAt), fmt(c.endAt)].filter(Boolean).join(' – ')
  const voting = votingState(c)
  const counts = await getVoteCounts(c.id)

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
              {` · ${voting.label}`}
            </p>
            <Link href="/news" className="muted text-sm underline">
              &larr; Back to news
            </Link>
          </div>

          {entries.length ? (
            <ContestVoting
              contestId={c.id}
              open={voting.open}
              label={voting.label}
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
              entries={entries.map((e) => ({
                id: e.id!,
                title: e.title,
                byline: `by ${e.participantFirstName}, age ${e.participantAge}`,
                img: mediaUrl(e.image as Media, 'card') ?? '',
                alt: `${e.title} — drawing by ${e.participantFirstName}, age ${e.participantAge}`,
                votes: counts[e.id!] ?? 0,
              }))}
            />
          ) : (
            <p className="muted text-center">Entries will appear here soon.</p>
          )}

          {c.rules ? (
            // Centred on the page with "Rules" centred over the text (client, 05.10.2026);
            // .contest-rules in contest.css lets the text fill this centred column.
            <div className="contest-rules mx-auto mt-12 max-w-[72ch]">
              <h2 className="text-center">Rules</h2>
              <RichText data={c.rules} />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
