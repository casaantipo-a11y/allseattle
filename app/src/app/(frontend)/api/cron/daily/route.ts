import { sendDailyReminders } from '@/lib/reminders'

// GET /api/cron/daily — called once a day by Vercel Cron (vercel.json), which
// sends "Authorization: Bearer $CRON_SECRET". Off while CRON_SECRET is empty, so
// nobody else can trigger the emails.

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return new Response('CRON_SECRET is not set', { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 })
  try {
    return Response.json(await sendDailyReminders())
  } catch (e) {
    console.error('[cron] daily failed', e)
    return new Response('Failed', { status: 500 })
  }
}
