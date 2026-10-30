import config from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'

import type { ImportSource } from '@/payload-types'

import { emailLayout, sendMail } from '../email'
import { absoluteUrl } from '../site'
import { pruneDismissed } from './dismissed'
import { importEvents } from './events'
import { importNews } from './news'
import { errorMessage, type ImportStats } from './types'

// The daily import (stage 4), run from /api/cron/daily after the reminders: every
// enabled source once, an old untouched draft cleaned away, and one email to the team
// when something new arrived or a source started failing. A source that fails never
// stops the others; its error is kept on the source (lastError) for the admin.

/** An unreviewed news draft is deleted after this long. */
const NEWS_DRAFT_DAYS = 14
const DAY = 24 * 3600 * 1000
/** An imported draft nobody opened: createdAt and updatedAt are within milliseconds, a save in the admin moves updatedAt away. */
const UNTOUCHED_MS = 1000
/**
 * A source is not started with less than this left of the budget. One network wait is up to
 * 20 s, and the cron function itself is cut off at 60: a source started at second 49 that
 * hangs would take the run's result, the cleanup and the report down with it.
 */
const START_MARGIN_MS = 15 * 1000

type Report = { name: string; target: string; stats: ImportStats; error: string; recovered: boolean }

const resultText = (s: ImportStats) => `${s.created} new, ${s.skipped} skipped${s.failed ? `, ${s.failed} failed` : ''}`
const errorText = (s: ImportStats) => s.error ?? (s.failed ? `${s.failed} failed — ${s.firstFailure ?? 'see the server log'}` : '')

/**
 * Drafts the importer made that nobody has touched since. News goes after 14 days — the
 * feed window is 3, so it doesn't come back. An event goes once its date has passed, not
 * sooner: events are read 60 days ahead, so deleting an upcoming one would only bring it
 * back on the next run.
 */
async function cleanOldDrafts(payload: Payload, now: number) {
  const base: Where[] = [{ origin: { equals: 'import' } }, { status: { equals: 'draft' } }]
  const untouched = <T extends { createdAt: string; updatedAt: string }>(docs: T[]) => docs.filter((d) => Date.parse(d.updatedAt) - Date.parse(d.createdAt) < UNTOUCHED_MS)
  let deleted = 0

  const news = await payload.find({
    collection: 'news',
    where: { and: [...base, { createdAt: { less_than: new Date(now - NEWS_DRAFT_DAYS * DAY).toISOString() } }] },
    limit: 200,
    depth: 0,
    select: { createdAt: true, updatedAt: true },
  })
  const newsIds = untouched(news.docs).map((d) => d.id)
  if (newsIds.length) {
    deleted += (await payload.delete({ collection: 'news', where: { id: { in: newsIds } }, context: { disableRevalidate: true, importCleanup: true } })).docs.length
  }

  const events = await payload.find({
    collection: 'events',
    where: { and: [...base, { startAt: { less_than: new Date(now).toISOString() } }] },
    limit: 200,
    depth: 0,
    select: { createdAt: true, updatedAt: true },
  })
  const eventIds = untouched(events.docs).map((d) => d.id)
  if (eventIds.length) {
    deleted += (await payload.delete({ collection: 'events', where: { id: { in: eventIds } }, context: { disableRevalidate: true, importCleanup: true } })).docs.length
  }
  return deleted
}

async function mailTeam(payload: Payload, reports: Report[], deleted: number) {
  const made = (target: string) => reports.filter((r) => r.target === target).reduce((n, r) => n + r.stats.created, 0)
  const news = made('news')
  const events = made('events')
  const failing = reports.filter((r) => r.error)
  const recovered = reports.filter((r) => r.recovered)
  if (!news && !events && !failing.length && !recovered.length) return false

  const paragraphs: string[] = []
  if (news || events) {
    paragraphs.push([news ? `${news} news` : '', events ? `${events} event${events === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ') + ' waiting as drafts.')
    if (news) paragraphs.push('Imported news carries the source’s own text: rewrite it in your own words and add a cover before publishing.')
  }
  for (const r of failing) paragraphs.push(`${r.name}: ${r.error}`)
  if (recovered.length) paragraphs.push(`Working again: ${recovered.map((r) => r.name).join(', ')}.`)
  if (deleted) paragraphs.push(`${deleted} old draft${deleted === 1 ? '' : 's'} nobody opened ${deleted === 1 ? 'was' : 'were'} removed.`)

  const subject = [news + events ? `${news + events} new draft${news + events === 1 ? '' : 's'}` : '', failing.length ? `${failing.length} source${failing.length === 1 ? '' : 's'} failing` : ''].filter(Boolean).join(', ')
  const mail = emailLayout({
    heading: 'Import report',
    paragraphs,
    button: { label: news || !events ? 'Open News' : 'Open Events', href: absoluteUrl(news || !events ? '/admin/collections/news' : '/admin/collections/events') },
  })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const to = settings.notifyEmail || process.env.NOTIFY_EMAIL
  if (!to) return false
  await sendMail({ to, subject: `Import: ${subject || 'sources are back'}`, ...mail })
  return true
}

export async function runDailyImport(deadline: number, now = Date.now()) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'import-sources', where: { enabled: { equals: true } }, pagination: false, depth: 0 })
  // The sources that waited longest go first, so a run that ends on the time limit
  // doesn't starve the same ones every day.
  const sources = (docs as ImportSource[]).sort((a, b) => (a.lastRunAt ? Date.parse(a.lastRunAt) : 0) - (b.lastRunAt ? Date.parse(b.lastRunAt) : 0))

  const reports: Report[] = []
  let notReached = 0
  for (const source of sources) {
    if (Date.now() > deadline - START_MARGIN_MS) {
      notReached++
      continue
    }
    let stats: ImportStats
    try {
      stats = source.target === 'news' ? await importNews(payload, source, deadline) : await importEvents(payload, source, deadline)
    } catch (e) {
      stats = { created: 0, skipped: 0, failed: 0, reasons: {}, error: errorMessage(e) }
    }
    const error = errorText(stats)
    const before = source.lastError ?? ''
    try {
      await payload.update({
        collection: 'import-sources',
        id: source.id,
        data: { lastRunAt: new Date().toISOString(), lastResult: resultText(stats), lastError: error },
        depth: 0,
      })
    } catch (e) {
      console.error('[import] could not save the result of', source.name, e)
    }
    // The team hears about a failure once, and again only if it changes — a broken feed
    // would otherwise be in the inbox every morning.
    reports.push({ name: source.name, target: source.target, stats, error: error && error !== before ? error : '', recovered: !error && !!before })
  }

  let deleted = 0
  try {
    deleted = await cleanOldDrafts(payload, now)
  } catch (e) {
    console.error('[import] cleanup failed', e)
  }
  try {
    await pruneDismissed(payload, now)
  } catch (e) {
    console.error('[import] could not prune the list of deleted items', e)
  }
  let mailed = false
  try {
    mailed = await mailTeam(payload, reports, deleted)
  } catch (e) {
    console.error('[import] report email failed', e)
  }
  return {
    sources: reports.length,
    notReached,
    created: reports.reduce((n, r) => n + r.stats.created, 0),
    failing: reports.filter((r) => errorText(r.stats)).length,
    deleted,
    mailed,
  }
}
