import { z } from 'zod'

import type { Business, BusinessCategory, Customer, Product, Promotion } from '@/payload-types'

import { SECTIONS } from '../collections/BusinessCategories'

import { packageFor, packageOfBusiness } from '../hooks/packageLimits'
import {
  CHECK,
  DAILY_LIMIT_ERROR,
  fail,
  isOwner,
  mediaIds,
  notifyTeam,
  overDailyLimit,
  payloadClient,
  relId,
  richFromText,
  saveFailed,
  settlePhotos,
  takePhotos,
  toFields,
  zodErrors,
  type CabinetResult,
  type PhotoChange,
} from './cabinet'
import { lexicalText } from './jobs'

// Stage 3, step 3: a business managed from a site account. Registering one
// creates the card as Pending review (the team publishes it, hooks/moderation.ts
// emails the owner). Once it is live, the owner's edits go live at once and the
// team gets a notice to look them over — a paying business shouldn't drop out
// of the directory for a day because it changed its hours. An existing business
// is handed to its owner by the team (the Owner field in the admin).
// Package limits (categories, photos, promotions, products) are the collection
// hooks' — a breach comes back as a field error.

/** Businesses one account may register (not counting rejected ones). */
export const MAX_BUSINESSES = 3
const MAX_HOURS_ROWS = 14

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null)

const url = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (!v ? null : /^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => !v || URL.canParse(v), 'That doesn’t look like a web address')

const businessSchema = z.object({
  name: z.string().trim().min(2, 'Please enter the business name').max(120),
  summary: opt(240),
  description: z.string().trim().max(6000, 'Please keep it under 6000 characters').optional(),
  address: opt(200),
  phone: opt(40).refine((v) => !v || v.replace(/\D/g, '').length >= 7, 'Enter a phone number with at least 7 digits'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .optional()
    .transform((v) => v || null)
    .pipe(z.email('That doesn’t look like an email address').nullable()),
  website: url,
  facebook: url,
  instagram: url,
  x: url,
  yelp: url,
})

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
  // the admin's day-only picker stores noon UTC; the same here
  .transform((v) => `${v}T12:00:00.000Z`)

const promotionSchema = z.object({
  title: z.string().trim().min(3, 'Please enter a title').max(120),
  description: opt(1000),
  validFrom: day,
  validUntil: day,
})

const productSchema = z.object({
  name: z.string().trim().min(2, 'Please enter a name').max(120),
  price: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[,$\s]/g, '') : ''))
    .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'A price like 25 or 19.99')
    .transform((v) => (v === '' ? null : Number(v))),
  description: opt(1000),
})

export type ItemKind = 'promotion' | 'product'
const ITEM_COLLECTION = { promotion: 'promotions', product: 'products' } as const

async function ownBusiness(customer: Customer, id: number) {
  const payload = await payloadClient()
  const biz = (await payload.findByID({ collection: 'businesses', id, depth: 0, overrideAccess: true, disableErrors: true })) as Business | null
  return { payload, biz: biz && isOwner(biz, customer) ? biz : null }
}

/** Register (no id) or edit (id) a business from the account form. */
export async function saveBusiness(customer: Customer, fd: FormData, id?: number): Promise<CabinetResult> {
  const payload = await payloadClient()
  let existing: Business | null = null
  if (id) {
    existing = (await ownBusiness(customer, id)).biz
    if (!existing) return fail(404, 'Business not found.')
  } else {
    const { totalDocs } = await payload.count({
      collection: 'businesses',
      where: { and: [{ owner: { equals: customer.id } }, { status: { not_equals: 'rejected' } }] },
      overrideAccess: true,
    })
    if (totalDocs >= MAX_BUSINESSES) return fail(400, `An account can register up to ${MAX_BUSINESSES} businesses. Contact us to add more.`)
  }
  if (await overDailyLimit(payload, customer.id)) return fail(429, DAILY_LIMIT_ERROR)

  const parsed = businessSchema.safeParse(toFields(fd))
  if (!parsed.success) return fail(400, CHECK, zodErrors(parsed.error.issues))
  const d = parsed.data

  const categories = [...new Set(fd.getAll('categories').map(Number).filter(Number.isInteger))]
  if (!categories.length) return fail(400, CHECK, { categories: 'Choose at least one category' })
  const { totalDocs: known } = await payload.count({ collection: 'business-categories', where: { id: { in: categories } } })
  if (known !== categories.length) return fail(400, CHECK, { categories: 'Choose categories from the list' })

  const days = fd.getAll('hoursDays').map((v) => String(v).trim().slice(0, 40))
  const times = fd.getAll('hoursTime').map((v) => String(v).trim().slice(0, 60))
  const hours = days.map((dd, i) => ({ days: dd, time: times[i] ?? '' })).filter((h) => h.days || h.time)
  if (hours.length > MAX_HOURS_ROWS) return fail(400, CHECK, { hours: `Up to ${MAX_HOURS_ROWS} rows` })
  if (hours.some((h) => !h.days || !h.time)) return fail(400, CHECK, { hours: 'Fill in both the days and the time of each row' })

  // The package in force decides how many gallery photos there may be; the hook checks again on save.
  const pkg = existing ? await packageOfBusiness(payload, existing.id) : await packageFor(payload, null)
  const changes: PhotoChange[] = []
  const photo = async (field: 'logo' | 'cover' | 'gallery', max: number) => {
    const took = await takePhotos(payload, customer, fd, field, mediaIds(existing?.[field]), { max, alt: `${d.name} — ${field === 'gallery' ? 'photo' : field}` })
    if (took.ok) changes.push(took.change)
    return took
  }
  const abort = async (r: CabinetResult) => {
    await settlePhotos(payload, customer, changes, false)
    return r
  }
  const logo = await photo('logo', 1)
  if (!logo.ok) return abort(logo.result)
  const cover = await photo('cover', 1)
  if (!cover.ok) return abort(cover.result)
  const gallery = await photo('gallery', pkg?.maxPhotos ?? 10)
  if (!gallery.ok) return abort(gallery.result)

  // An unchanged description keeps its formatting (headings, lists the team may have added).
  const description = existing && lexicalText(existing.description) === (d.description ?? '') ? undefined : (richFromText(d.description) ?? null)
  const live = existing?.status === 'published'
  const data = {
    name: d.name,
    categories,
    summary: d.summary,
    ...(description !== undefined ? { description } : {}),
    address: d.address,
    phone: d.phone,
    email: d.email,
    website: d.website,
    socials: { facebook: d.facebook, instagram: d.instagram, x: d.x, yelp: d.yelp },
    hours,
    logo: logo.change.ids[0] ?? null,
    cover: cover.change.ids[0] ?? null,
    gallery: gallery.change.ids,
    ...(live ? {} : { status: 'pending' as const, moderationNote: null }),
    ...(existing ? {} : { owner: customer.id }),
  }

  let saved: Business
  try {
    saved = existing
      ? await payload.update({ collection: 'businesses', id: existing.id, data, overrideAccess: true, depth: 0 })
      : await payload.create({ collection: 'businesses', data: { ...data, status: 'pending' }, overrideAccess: true, depth: 0 })
  } catch (e) {
    await settlePhotos(payload, customer, changes, false)
    return saveFailed(e, 'business')
  }
  await settlePhotos(payload, customer, changes, true)
  await notifyTeam(
    payload,
    live ? `Business updated by its owner (already live): ${saved.name}` : `${existing ? 'Edited' : 'New'} business to review: ${saved.name}`,
    `/admin/collections/businesses/${saved.id}`,
    customer,
  )
  return {
    ok: true,
    id: saved.id,
    message: live ? 'Saved. The changes are on the site.' : 'Sent for review. We usually check new businesses within a day — you will get an email.',
  }
}

/** Add (no itemId) or edit a promotion or product of the account's business. */
export async function saveItem(customer: Customer, bizId: number, kind: ItemKind, fd: FormData, itemId?: number): Promise<CabinetResult> {
  const { payload, biz } = await ownBusiness(customer, bizId)
  if (!biz) return fail(404, 'Business not found.')
  const collection = ITEM_COLLECTION[kind]
  let existing: Promotion | Product | null = null
  if (itemId) {
    existing = (await payload.findByID({ collection, id: itemId, depth: 0, overrideAccess: true, disableErrors: true })) as Promotion | Product | null
    if (!existing || relId(existing.business) !== biz.id) return fail(404, 'Not found.')
  }
  const parsed = (kind === 'promotion' ? promotionSchema : productSchema).safeParse(toFields(fd))
  if (!parsed.success) return fail(400, CHECK, zodErrors(parsed.error.issues))
  const d = parsed.data as Record<string, unknown>
  if (kind === 'promotion' && new Date(d.validUntil as string) < new Date(d.validFrom as string)) {
    return fail(400, CHECK, { validUntil: 'Ends before it starts' })
  }
  const label = String(d.title ?? d.name)
  const took = await takePhotos(payload, customer, fd, 'image', mediaIds(existing?.image), { max: 1, alt: `${biz.name} — ${label}` })
  if (!took.ok) return took.result
  const data = { ...d, business: biz.id, image: took.change.ids[0] ?? null }
  let saved: Promotion | Product
  try {
    saved = (existing
      ? await payload.update({ collection, id: existing.id, data: data as never, overrideAccess: true, depth: 0 })
      : await payload.create({ collection, data: data as never, overrideAccess: true, depth: 0 })) as Promotion | Product
  } catch (e) {
    await settlePhotos(payload, customer, [took.change], false)
    const r = saveFailed(e, kind)
    // the package checks report on `business`, which has no field in this form
    return !r.ok && r.fieldErrors?.business ? fail(400, r.fieldErrors.business) : r
  }
  await settlePhotos(payload, customer, [took.change], true)
  if (!existing) await notifyTeam(payload, `New ${kind} on ${biz.name}: ${label}`, `/admin/collections/${collection}/${saved.id}`, customer)
  return { ok: true, id: saved.id, message: 'Saved.' }
}

export async function deleteItem(customer: Customer, bizId: number, kind: ItemKind, itemId: number): Promise<CabinetResult> {
  const { payload, biz } = await ownBusiness(customer, bizId)
  if (!biz) return fail(404, 'Business not found.')
  const collection = ITEM_COLLECTION[kind]
  const item = (await payload.findByID({ collection, id: itemId, depth: 0, overrideAccess: true, disableErrors: true })) as Promotion | Product | null
  if (!item || relId(item.business) !== biz.id) return fail(404, 'Not found.')
  try {
    await payload.delete({ collection, id: itemId, overrideAccess: true })
  } catch (e) {
    return saveFailed(e, kind)
  }
  await settlePhotos(payload, customer, [{ ids: [], added: [], removed: mediaIds(item.image) }], true)
  return { ok: true, id: itemId, message: 'Deleted.' }
}

/** The account's businesses with their package, for the account pages. */
export async function myBusinesses(customerId: number) {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'businesses',
    where: { owner: { equals: customerId } },
    sort: 'name',
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })
  return docs
}

/** One business of the account with its promotions and products, or null. */
export async function myBusiness(customer: Customer, id: number) {
  const payload = await payloadClient()
  const biz = (await payload.findByID({ collection: 'businesses', id, depth: 1, overrideAccess: true, disableErrors: true })) as Business | null
  if (!biz || !isOwner(biz, customer)) return null
  const [promotions, products, pkg] = await Promise.all([
    payload.find({ collection: 'promotions', where: { business: { equals: id } }, sort: '-validFrom', depth: 1, limit: 200, overrideAccess: true }),
    payload.find({ collection: 'products', where: { business: { equals: id } }, sort: 'name', depth: 1, limit: 1000, overrideAccess: true }),
    packageOfBusiness(payload, id),
  ])
  return { biz, promotions: promotions.docs, products: products.docs, pkg }
}

/** Category choices for the account form: grouped by their top category (or the
 *  site section, for a top category with nothing under it), deeper levels as a path. */
export function categoryOptions(categories: BusinessCategory[]) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const chain = (c: BusinessCategory) => {
    const out = [c]
    for (let p = relId(c.parent); p && out.length < 10; p = relId(byId.get(p)?.parent)) {
      const parent = byId.get(p)
      if (!parent) break
      out.unshift(parent)
    }
    return out
  }
  const hasChildren = new Set(categories.map((c) => relId(c.parent)).filter(Boolean))
  const section = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label])) as Record<string, string>
  return categories
    .map((c) => {
      const path = chain(c)
      const root = path[0]
      const leafRoot = path.length === 1 && !hasChildren.has(c.id)
      return {
        id: c.id,
        group: leafRoot ? section[c.section] : root.name,
        label: path.length === 1 ? (leafRoot ? c.name : `${c.name} (all)`) : path.slice(1).map((x) => x.name).join(' › '),
      }
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
}
