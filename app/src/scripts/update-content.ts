/**
 * pnpm update-content — brings an existing database in line with what the client
 * agreed on, without touching anything else. Safe to run again: it only sets values.
 *
 *   - packages: names, prices and limits from Commercial.pdf (15.10.2026; Luxury → Lux)
 *   - the Advertise page text: banner places are sold by the month, not by the week
 *   - the HOME_RIGHT_2 ad slot (home page, Block C2)
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
import { doc, p } from './lexical'
import { ADVERTISE_TEXT, PACKAGES } from './seed-businesses'
import { SLOTS } from './seed-phase4'

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
    const { features, ...values } = pk
    await payload.update({ collection: 'packages', id: found.id, data: { ...values, features: features.map((text) => ({ text })) }, context: ctx })
    log(`package ${found.name}${found.name !== pk.name ? ` → ${pk.name}` : ''}: $${pk.priceMonthly}/mo, $${pk.priceYearly}/yr, ${pk.maxCategories} categories, ${pk.maxPhotos} photos, ${pk.maxProducts} products`)
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

  // ---- The Advertise page text
  const advertise = (await payload.find({ collection: 'pages', where: { slug: { equals: 'advertise' } }, limit: 1, depth: 0 })).docs[0]
  if (advertise) {
    await payload.update({ collection: 'pages', id: advertise.id, data: { content: doc(...ADVERTISE_TEXT.map(p)) } as never, context: ctx })
    log('Advertise page text: banner places by the month')
  }

  // ---- Home page Block C2 (HOME_RIGHT_2), the place the client added on 15.10.2026
  const c2 = await payload.find({ collection: 'ad-slots', where: { code: { equals: 'HOME_RIGHT_2' } }, limit: 1, depth: 0 })
  const slot = SLOTS.find((s) => s.code === 'HOME_RIGHT_2')
  if (c2.docs[0] && slot && c2.docs[0].desktopSize !== slot.desktopSize) {
    await payload.update({ collection: 'ad-slots', id: c2.docs[0].id, data: { desktopSize: slot.desktopSize, name: `${slot.name} · Block C2` } as never, context: ctx })
    log(`ad slot HOME_RIGHT_2 resized to ${slot.desktopSize}`)
  }
  if (!c2.totalDocs && slot) {
    await payload.create({
      collection: 'ad-slots',
      data: { ...slot, name: `${slot.name} · Block C2`, sortOrder: SLOTS.indexOf(slot), isActive: true },
      context: ctx,
    })
    log('ad slot HOME_RIGHT_2 (Home — right column, Block C2) created')
  }

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
