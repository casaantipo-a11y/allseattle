import { runDailyImport } from '@/lib/import/run'
import { sendDailyReminders } from '@/lib/reminders'

// GET /api/cron/daily — called once a day by Vercel Cron (vercel.json), which
// sends "Authorization: Bearer $CRON_SECRET". Off while CRON_SECRET is empty, so
// nobody else can trigger the emails. The reminders go first; the content import
// (events and news drafts) gets what is left of the minute. Neither can stop the
// other: a failure is logged and shows in the status of the answer.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How long the import may run, counted from the start of the request. */
const IMPORT_BUDGET_MS = 50 * 1000

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return new Response('CRON_SECRET is not set', { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 })
  const started = Date.now()
  let failed = false
  const answer: Record<string, unknown> = {}
  try {
    answer.reminders = await sendDailyReminders()
  } catch (e) {
    console.error('[cron] reminders failed', e)
    answer.reminders = 'failed'
    failed = true
  }
  try {
    answer.import = await runDailyImport(started + IMPORT_BUDGET_MS)
  } catch (e) {
    console.error('[cron] import failed', e)
    answer.import = 'failed'
    failed = true
  }
  return Response.json(answer, { status: failed ? 500 : 200 })
}
