/**
 * pnpm normalize-titles — puts the titles of the existing car listings in one look
 * ("2015 NISSAN ROGUE" → "2015 Nissan Rogue", "2018 Audi a5 sport" → "2018 Audi A5 Sport"),
 * the same rule new listings get on every save (lib/car-models.ts normalizeModel). It looks
 * first and changes nothing: it prints "was → will be" for every listing that would change.
 * With --apply (or NORMALIZE_TITLES_YES=1) it saves the model and the title.
 *
 *   pnpm normalize-titles                 look only
 *   pnpm normalize-titles --apply         save
 *
 * (The package script ends with `--` so that `payload run` hands `--apply` on to this file.)
 *
 * It writes with plain SQL, like the counters: no hooks, no moderation mail, and `updatedAt`
 * stays as it was — otherwise every owner's "saved today" count (the daily limit) and the
 * half-minute gap between saves would see a mass edit. Slugs are not touched (a slug is lower
 * case already, so a case change never changes it). Safe to run again. Afterwards it asks the
 * running site to drop its cached lists.
 *
 * Production: pnpm normalize-titles:prod [--apply] (scripts/prod.mjs).
 */
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import { normalizeModel } from '../lib/car-models'
import config from '../payload.config'
import { revalidateSite } from './revalidate-site'

const log = (m: string) => console.log(`[normalize-titles] ${m}`)
type Db = { drizzle: { execute: (q: unknown) => Promise<unknown> } }

async function run() {
  const apply = process.argv.includes('--apply') || process.env.NORMALIZE_TITLES_YES === '1'
  const payload = await getPayload({ config })
  const cars = (await payload.find({ collection: 'car-listings', pagination: false, depth: 1, sort: 'id', overrideAccess: true })).docs

  let changes = 0
  let saved = 0
  for (const car of cars) {
    const make = typeof car.make === 'object' && car.make ? car.make : null
    if (!make || !car.model?.trim()) {
      log(`#${car.id} skipped: no make or model (${car.title ?? '-'})`)
      continue
    }
    const model = normalizeModel(make.models, car.model)
    const title = [car.year, make.name, model].filter(Boolean).join(' ')
    if (model === car.model && title === car.title) continue
    changes++
    log(`#${car.id} [${car.status}] ${car.title}  →  ${title}${model !== car.model ? `   (model "${car.model}" → "${model}")` : ''}`)
    if (!apply) continue
    try {
      await (payload.db as unknown as Db).drizzle.execute(sql`UPDATE "car_listings" SET "model" = ${model}, "title" = ${title} WHERE "id" = ${car.id}`)
      saved++
    } catch (e) {
      console.error(`[normalize-titles] #${car.id} not saved:`, e instanceof Error ? e.message : e)
    }
  }

  log(`${cars.length} listings looked at, ${changes} to change${apply ? `, ${saved} saved` : ''}`)
  if (!apply && changes) log('nothing was changed — run again with --apply to save (pnpm normalize-titles --apply)')
  if (apply && saved) await revalidateSite(log)
  process.exit(0)
}

// Top-level await: `payload run` ends the process as soon as the module has loaded.
try {
  await run()
} catch (e) {
  console.error('[normalize-titles] failed:', e instanceof Error ? e.message : e)
  process.exit(1)
}
