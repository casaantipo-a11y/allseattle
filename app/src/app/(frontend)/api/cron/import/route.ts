import { runDailyImport } from '@/lib/import/run'

// GET /api/cron/import — the news sources only, several times a day (vercel.json), so a story
// reaches the drafts within hours instead of the next morning. Same secret as /api/cron/daily.
// No reminders, no cleanup and no daily report here: those stay with the morning run, which
// also covers the events. Only a source starting to fail (or recovering) is mailed from here.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How long the import may run, counted from the start of the request. */
const IMPORT_BUDGET_MS = 50 * 1000

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return new Response('CRON_SECRET is not set', { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 })
  try {
    return Response.json({ import: await runDailyImport(Date.now() + IMPORT_BUDGET_MS, { digest: false }) })
  } catch (e) {
    console.error('[cron] news import failed', e)
    return Response.json({ import: 'failed' }, { status: 500 })
  }
}
