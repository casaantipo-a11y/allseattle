/**
 * pnpm import-run — the daily import once, on demand: every enabled source, the cleanup
 * of old untouched drafts and the report email, exactly what /api/cron/daily does after
 * the reminders. Use it for the first run after the sources are set up, or to look at a
 * new source without waiting for the morning. It does NOT send the reminders, so running
 * it never mails a customer. The report goes to the team address when Resend is set up.
 *
 * Production: pnpm import-run:prod (scripts/prod.mjs).
 */
import { runDailyImport } from '../lib/import/run'

try {
  console.log('[import-run]', JSON.stringify(await runDailyImport(Date.now() + 50 * 1000)))
} catch (e) {
  console.error('[import-run] failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}
process.exit(0)
