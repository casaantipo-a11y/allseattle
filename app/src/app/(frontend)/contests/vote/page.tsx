import type { Metadata } from 'next'
import Link from 'next/link'

import { AccountShell } from '@/components/account/AccountShell'
import { ConfirmVote } from '@/components/ConfirmVote'
import { voteByToken, votingState } from '@/lib/contest-votes'
import { mediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

export const metadata: Metadata = { title: 'Confirm your vote', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ token?: string }> }

// Where the voting email leads (stage 3, step 6): shows what the vote is for and
// counts it only on the button press (see lib/contest-votes.ts).
export default async function ConfirmVotePage({ searchParams }: Props) {
  const token = (await searchParams).token ?? ''
  const vote = await voteByToken(token)
  if (!vote) {
    return (
      <AccountShell eyebrow="Contest vote" title="Link not valid">
        <div>This link doesn’t work any more — a newer one may have been sent, or the vote was removed. You can vote again from the contest page.</div>
      </AccountShell>
    )
  }
  const contest = vote.contest
  const entry = (contest.entries ?? []).find((e) => e.id === vote.entryId)
  const img = entry && typeof entry.image === 'object' ? mediaUrl(entry.image as Media, 'card') : null
  const state = votingState(contest)
  return (
    <AccountShell
      eyebrow="Contest vote"
      title="Confirm your vote"
      intro={
        <>
          In{' '}
          <Link href={`/contests/${contest.slug}`} className="text-brand-navy underline">
            {contest.title}
          </Link>
          . One vote per email per contest.
        </>
      }
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- Payload rendition
        <img src={img} alt="" className="mb-4 aspect-[4/3] w-full rounded-lg object-cover" />
      ) : null}
      <h2>{vote.entryTitle}</h2>
      {entry ? (
        <div className="mb-6 text-brand-slate">
          by {entry.participantFirstName}, age {entry.participantAge}
        </div>
      ) : null}
      {vote.confirmedAt ? (
        <div className="success-panel" role="status">
          <div>Your vote is already counted. Thank you!</div>
        </div>
      ) : state.open ? (
        <ConfirmVote token={token} contestSlug={contest.slug} />
      ) : (
        <div>{state.label}. This vote can’t be counted any more.</div>
      )}
    </AccountShell>
  )
}
