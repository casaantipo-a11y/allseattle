/**
 * pnpm hide-demo — takes the demo filler off the live site without deleting anything (the
 * blanket `pnpm purge-demo` would also remove categories and pictures the real content uses).
 * It looks first and changes nothing; with HIDE_DEMO_YES=1 it saves. Safe to run again.
 *
 *   - banners marked isDemo whose link points at this site's old preview address (*.vercel.app):
 *     a business that no longer exists, the click is a 404 → status Draft. The place goes back
 *     to the "Your Ad Here" offer.
 *   - banners marked isDemo that lead to a real website (a real advertiser given a place for
 *     free): the demo mark comes off, so the place counts as Booked and the banner no longer
 *     gives way to a paid one.
 *   - car listings marked isDemo: status Draft (fake phone numbers must not be on a live site).
 *
 * Everything stays in the database; Draft → Published in the admin brings any of it back.
 *
 * Production: pnpm hide-demo:prod (scripts/prod.mjs).
 */
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '../payload.config'
import { revalidateSite } from './revalidate-site'

const log = (m: string) => console.log(`[hide-demo] ${m}`)
const ctx = { disableRevalidate: true }
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

async function run() {
  const apply = process.env.HIDE_DEMO_YES === '1'
  const payload = await getPayload({ config })
  let planned = 0
  let failed = 0

  const step = async (what: string, change: () => Promise<unknown>) => {
    planned++
    log(`${apply ? '' : 'would: '}${what}`)
    if (!apply) return
    try {
      await change()
    } catch (e) {
      failed++
      console.error(`[hide-demo]   not saved: ${e instanceof Error ? e.message : e}`)
    }
  }

  const banners = (await payload.find({ collection: 'banners', where: { isDemo: { equals: true } }, pagination: false, depth: 0, sort: 'id' })).docs
  for (const b of banners) {
    const host = hostOf(b.linkUrl)
    if (host.endsWith('.vercel.app') || host === 'localhost') {
      if (b.status === 'draft') continue
      await step(`banner #${b.id} ${b.advertiser} (${host}) → Draft`, () => payload.update({ collection: 'banners', id: b.id, data: { status: 'draft' }, depth: 0, context: ctx }))
    } else {
      await step(`banner #${b.id} ${b.advertiser} (${host}) → real advertiser, demo mark off`, () => payload.update({ collection: 'banners', id: b.id, data: { isDemo: false }, depth: 0, context: ctx }))
    }
  }

  const cars = (await payload.find({ collection: 'car-listings', where: { and: [{ isDemo: { equals: true } }, { status: { not_equals: 'draft' } }] }, pagination: false, depth: 0, sort: 'id' })).docs
  const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  for (const c of cars) {
    await step(`car #${c.id} ${c.title} → Draft`, async () => {
      try {
        await payload.update({ collection: 'car-listings', id: c.id, data: { status: 'draft' }, depth: 0, context: ctx })
      } catch (e) {
        // Hiding must not depend on the make's model list (a model missing from it fails every save).
        log(`  save refused (${e instanceof Error ? e.message : e}) — setting the status directly`)
        await db.drizzle.execute(sql`UPDATE "car_listings" SET "status" = 'draft' WHERE "id" = ${c.id}`)
      }
    })
  }

  if (!planned) return log('Nothing to do.')
  if (!apply) return log(`Nothing changed. ${planned} change(s) listed; run again with HIDE_DEMO_YES=1 to save them.`)
  log(`${planned - failed} saved${failed ? `, ${failed} failed` : ''}`)
  await revalidateSite(log)
}

try {
  await run()
} catch (e) {
  console.error('[hide-demo] failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}
process.exit(0)
