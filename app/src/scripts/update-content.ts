/**
 * pnpm update-content — brings an existing database in line with what the client
 * agreed on, without touching anything else. Safe to run again: it only sets values.
 *
 *   - packages: prices and limits from Commercial.pdf (15.10.2026)
 *   - news: the "Safety" category becomes "Crime & Safety" (the slug, and so every
 *     article URL, stays /news/safety/…)
 *   - NEW_ADMIN_EMAIL=… : creates that team member as an admin with a temporary
 *     password, printed once (the site's email isn't connected yet, so no invite goes out)
 *
 * Production: pnpm update-content:prod (scripts/prod.mjs).
 */
import { randomBytes } from 'node:crypto'

import { getPayload } from 'payload'

import config from '../payload.config'
import { revalidateSite } from './revalidate-site'
import { PACKAGES } from './seed-businesses'

const log = (m: string) => console.log(`[update-content] ${m}`)

async function run() {
  const payload = await getPayload({ config })
  const ctx = { disableRevalidate: true }

  // ---- Packages: matched by order (1, 2, 3), so a renamed package still gets its values.
  for (const pk of PACKAGES) {
    const found = (await payload.find({ collection: 'packages', where: { order: { equals: pk.order } }, limit: 1, depth: 0 })).docs[0]
    if (!found) {
      log(`no package with order ${pk.order} (${pk.name}) — run the seed first`)
      continue
    }
    const { name: _name, features: _features, ...values } = pk
    await payload.update({ collection: 'packages', id: found.id, data: values, context: ctx })
    log(`package ${found.name}: $${pk.priceMonthly}/mo, $${pk.priceYearly}/yr, ${pk.maxCategories} categories, ${pk.maxPhotos} photos, ${pk.maxProducts} products`)
  }

  // ---- News: Safety → Crime & Safety
  const safety = (await payload.find({ collection: 'news-categories', where: { slug: { equals: 'safety' } }, limit: 1, depth: 0 })).docs[0]
  if (safety) {
    await payload.update({
      collection: 'news-categories',
      id: safety.id,
      data: { name: 'Crime & Safety', description: 'Crime, police and fire reports, accidents and incidents across Seattle.' },
      context: ctx,
    })
    log('news category "Safety" → "Crime & Safety" (/news/safety)')
  } else log('no "safety" news category — nothing renamed')

  // ---- A new admin, only when asked for
  const email = process.env.NEW_ADMIN_EMAIL?.trim().toLowerCase()
  if (email) {
    const exists = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })
    if (exists.totalDocs) log(`admin ${email} already exists — password left as it is`)
    else {
      const password = randomBytes(9).toString('base64url')
      await payload.create({ collection: 'users', data: { email, password, roles: ['admin'] } as never, context: ctx })
      log(`admin created: ${email}  temporary password: ${password}  (change it after the first login)`)
    }
  }

  await revalidateSite(log)
  log('done')
}

await run()
process.exit(0)
