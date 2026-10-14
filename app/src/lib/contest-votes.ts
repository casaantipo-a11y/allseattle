import { createHash, randomBytes } from 'node:crypto'

import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { revalidateTag, unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { z } from 'zod'

import type { Contest, ContestVote } from '@/payload-types'

import { emailLayout, sendMail } from './email'
import { absoluteUrl } from './site'

// Contest voting (stage 3, step 6): one vote per email per contest, counted once
// the voter opens the emailed link and presses "Confirm" — a plain GET would let
// mail scanners that pre-open links confirm votes on their own. Voting is open
// while the contest is Active and today is within its dates (Seattle time).

const payload = () => getPayload({ config })

/** Vote requests one connection may send per hour. */
const IP_LIMIT = 10
/** A new link for the same unconfirmed vote at most this often. */
const RESEND_MS = 2 * 60 * 1000
const VOTES_TAG = 'contest-votes'

export type VotingState = { open: boolean; label: string }

const seattleDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

/** Whether people can vote now. Dates are day-only (stored at noon UTC): voting
 *  runs from the start day through the whole end day, Seattle time. */
export function votingState(c: Pick<Contest, 'status' | 'startAt' | 'endAt'>, now = new Date()): VotingState {
  const today = seattleDay(now)
  const start = c.startAt?.slice(0, 10)
  const end = c.endAt?.slice(0, 10)
  if (c.status === 'finished' || (end && today > end)) return { open: false, label: 'Voting closed' }
  if (c.status !== 'active') return { open: false, label: start ? `Voting opens ${fmt(c.startAt!)}` : 'Voting opens soon' }
  if (start && today < start) return { open: false, label: `Voting opens ${fmt(c.startAt!)}` }
  return { open: true, label: end ? `Voting until ${fmt(c.endAt!)}` : 'Voting is open' }
}

/** Confirmed votes per entry id. Cached; a confirmation expires the tag. */
export const getVoteCounts = unstable_cache(
  async (contestId: number): Promise<Record<string, number>> => {
    const db = (await payload()).db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: { entry_id: string; n: string | number }[] }> } }
    const { rows } = await db.drizzle.execute(sql`
      SELECT "entry_id", count(*) AS n FROM "contest_votes"
      WHERE "contest_id" = ${contestId} AND "confirmed_at" IS NOT NULL
      GROUP BY "entry_id"`)
    return Object.fromEntries(rows.map((r) => [r.entry_id, Number(r.n)]))
  },
  ['contest-vote-counts'],
  { tags: [VOTES_TAG], revalidate: 300 },
)

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export const voteSchema = z.object({
  contest: z.string().regex(/^\d+$/).transform(Number),
  entry: z.string().trim().min(1).max(64),
  email: z.email('That doesn’t look like an email address').trim().toLowerCase(),
})

export type VoteResult = { ok: true; message: string } | { ok: false; status: number; error: string; field?: string }

/** Records (or re-sends) a vote and emails the confirmation link. */
export async function castVote(input: z.infer<typeof voteSchema>, ip: string): Promise<VoteResult> {
  const p = await payload()
  const contest = (await p.findByID({ collection: 'contests', id: input.contest, depth: 0, disableErrors: true })) as Contest | null
  if (!contest) return { ok: false, status: 404, error: 'Contest not found.' }
  if (!votingState(contest).open) return { ok: false, status: 400, error: 'Voting is not open for this contest.' }
  const entry = (contest.entries ?? []).find((e) => e.id === input.entry && e.parentConsent)
  if (!entry) return { ok: false, status: 400, error: 'That entry is not in this contest.' }

  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
  if (ip !== 'unknown') {
    const { totalDocs } = await p.count({
      collection: 'contest-votes',
      where: { and: [{ ip: { equals: ip } }, { updatedAt: { greater_than: hourAgo } }] },
      overrideAccess: true,
    })
    if (totalDocs >= IP_LIMIT) return { ok: false, status: 429, error: 'Too many votes from your connection. Please try again in an hour.' }
  }

  const existing = (
    await p.find({
      collection: 'contest-votes',
      where: { and: [{ contest: { equals: contest.id } }, { email: { equals: input.email } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0] as ContestVote | undefined
  if (existing?.confirmedAt) return { ok: false, status: 400, field: 'email', error: 'This email has already voted in this contest.' }
  if (existing?.sentAt && Date.now() - new Date(existing.sentAt).getTime() < RESEND_MS) {
    return { ok: false, status: 429, error: 'We just sent you a link. Please check your inbox (and the spam folder).' }
  }

  const token = randomBytes(24).toString('hex')
  const data = { entryId: entry.id!, entryTitle: entry.title, tokenHash: hash(token), ip, sentAt: new Date().toISOString() }
  try {
    if (existing) await p.update({ collection: 'contest-votes', id: existing.id, data, overrideAccess: true })
    else await p.create({ collection: 'contest-votes', data: { ...data, contest: contest.id, email: input.email }, overrideAccess: true })
  } catch (e) {
    console.error('[vote] could not save', e)
    return { ok: false, status: 500, error: 'Something went wrong on our side. Please try again in a minute.' }
  }

  const mail = emailLayout({
    heading: 'Confirm your vote',
    paragraphs: [
      `You voted for “${entry.title}” by ${entry.participantFirstName}, age ${entry.participantAge}, in “${contest.title}”.`,
      'Press the button to confirm it — one vote per email per contest. If it wasn’t you, ignore this message and nothing is counted.',
    ],
    button: { label: 'Confirm my vote', href: absoluteUrl(`/contests/vote?token=${token}`) },
  })
  await sendMail({ to: input.email, subject: `Confirm your vote: ${contest.title}`, ...mail })
  return { ok: true, message: 'Almost done — we sent you an email. Open the link in it to confirm your vote.' }
}

/** The vote behind an emailed link, for the confirmation page. */
export async function voteByToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null
  const p = await payload()
  const vote = (
    await p.find({ collection: 'contest-votes', where: { tokenHash: { equals: hash(token) } }, limit: 1, depth: 1, overrideAccess: true })
  ).docs[0] as (ContestVote & { contest: Contest }) | undefined
  if (!vote || typeof vote.contest !== 'object') return null
  return vote
}

/** Counts the vote behind a link. */
export async function confirmVote(token: string): Promise<VoteResult & { slug?: string | null }> {
  const vote = await voteByToken(token)
  if (!vote) return { ok: false, status: 404, error: 'This link is not valid. It may have been replaced by a newer one.' }
  const contest = vote.contest
  if (vote.confirmedAt) return { ok: true, message: 'Your vote was already counted. Thank you!', slug: contest.slug }
  if (!votingState(contest).open) return { ok: false, status: 400, error: 'Voting for this contest has closed.', slug: contest.slug }
  const p = await payload()
  await p.update({ collection: 'contest-votes', id: vote.id, data: { confirmedAt: new Date().toISOString() }, overrideAccess: true })
  try {
    revalidateTag(VOTES_TAG, { expire: 0 })
  } catch {
    // outside a request — the counts refresh on their own within minutes
  }
  return { ok: true, message: `Your vote for “${vote.entryTitle}” is counted. Thank you!`, slug: contest.slug }
}
