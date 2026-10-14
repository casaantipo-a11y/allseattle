import config from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'
import { z } from 'zod'

import type { CarListing, Customer, Job } from '@/payload-types'

import { slugify } from '../fields'
import { doc as lexDoc, p as lexP } from '../scripts/lexical'
import { MAX_BYTES, PHOTO_TYPES } from './forms'
import { notifyEmail, notifyTelegram } from './notify'
import { absoluteUrl } from './site'

// Stage 3, step 2: cars and jobs posted by site customers. Everything a customer
// may do goes through here (api/account/listings/*), with the local API and the
// ownership checks in code — the collections' own REST write access stays
// team-only. A new or edited listing waits for the team as `pending`; the team
// publishes or rejects it in the admin (hooks/moderation.ts emails the author).

export type Kind = 'car' | 'job'
export const COLLECTION = { car: 'car-listings', job: 'jobs' } as const

/** Live or waiting listings a private account may have at once (cars and jobs together). */
export const ACTIVE_LIMIT = 3
/** How long a listing stays up before it needs renewing. */
export const LISTING_DAYS = 30
/** Listings an account may send (create or edit) per 24 hours — a brake on spam. */
const DAILY_SENDS = 10
export const MAX_CAR_PHOTOS = 10

const intField = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[,$\s]/g, ''))
    .pipe(z.string().regex(/^\d+$/, `${label}: numbers only`))
    .transform(Number)
    .pipe(z.number().min(min, `${label} is too small`).max(max, `${label} is too large`))
const optInt = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(intField(label, min, max).optional())

export const carSchema = z.object({
  make: z.string().regex(/^\d+$/, 'Choose a make').transform(Number),
  model: z.string().trim().min(1, 'Choose a model').max(60),
  year: intField('Year', 1950, new Date().getFullYear() + 1),
  price: intField('Price', 1, 5_000_000),
  mileage: intField('Mileage', 0, 2_000_000),
  engine: z.string().trim().max(60).optional(),
  transmission: z.enum(['Automatic', 'CVT Automatic', 'Manual'], 'Choose a transmission'),
  fuelType: z.enum(['Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'], 'Choose a fuel type'),
  drivetrain: z.enum(['FWD', 'RWD', 'AWD', '4WD']).optional().or(z.literal('').transform(() => undefined)),
  bodyType: z.enum(['sedan', 'suv', 'truck', 'hatchback', 'coupe', 'convertible', 'wagon', 'van'], 'Choose a body type'),
  exteriorColor: z.string().trim().max(40).optional(),
  vin: z.string().trim().toUpperCase().max(17, 'A VIN has 17 characters').optional(),
  description: z.string().trim().max(3000, 'Please keep it under 3000 characters').optional(),
  sellerName: z.string().trim().min(2, 'Please enter your name').max(80),
  sellerPhone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, '').length >= 7, 'Enter a phone number with at least 7 digits'),
})

export const jobSchema = z.object({
  title: z.string().trim().min(3, 'Please enter the job title').max(120),
  companyName: z.string().trim().min(2, 'Please enter the company name').max(120),
  category: z.string().regex(/^\d+$/, 'Choose a category').transform(Number),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary'], 'Choose the type'),
  workMode: z.enum(['on-site', 'hybrid', 'remote']).default('on-site'),
  salaryMin: optInt('Minimum pay', 0, 10_000_000),
  salaryMax: optInt('Maximum pay', 0, 10_000_000),
  salaryPeriod: z.enum(['hour', 'year']).default('hour'),
  location: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(300, 'Two lines — under 300 characters').optional(),
  description: z.string().trim().max(6000, 'Please keep it under 6000 characters').optional(),
  howToApply: z.string().trim().min(5, 'Tell people how to apply').max(500),
})

export type ListingResult = { ok: true; id: number; message: string } | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> }

const fail = (status: number, error: string, fieldErrors?: Record<string, string>): ListingResult => ({ ok: false, status, error, fieldErrors })

export async function payloadClient() {
  return getPayload({ config })
}

/** The site customer behind a request (auth cookie), or null for anyone else. */
export async function customerFrom(req: Request): Promise<Customer | null> {
  const payload = await payloadClient()
  try {
    const { user } = await payload.auth({ headers: req.headers })
    return user && user.collection === 'customers' ? (user as Customer) : null
  } catch {
    return null
  }
}

const ownerId = (d: { owner?: number | Customer | null }) => (typeof d.owner === 'object' && d.owner ? d.owner.id : d.owner)

/** Pending and live (not expired) listings of an account, cars and jobs together. */
export async function activeCount(payload: Payload, customerId: number, excludeId?: { kind: Kind; id: number }) {
  const now = new Date().toISOString()
  const where = (kind: Kind): Where => ({
    and: [
      { owner: { equals: customerId } },
      { status: { in: ['pending', 'published'] } },
      { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now } }] },
      ...(excludeId?.kind === kind ? [{ id: { not_equals: excludeId.id } }] : []),
    ],
  })
  const [cars, jobs] = await Promise.all([
    payload.count({ collection: 'car-listings', where: where('car'), overrideAccess: true }),
    payload.count({ collection: 'jobs', where: where('job'), overrideAccess: true }),
  ])
  return cars.totalDocs + jobs.totalDocs
}

async function sentToday(payload: Payload, customerId: number) {
  const since = new Date(Date.now() - 86400000).toISOString()
  const where: Where = { and: [{ owner: { equals: customerId } }, { updatedAt: { greater_than: since } }] }
  const [cars, jobs] = await Promise.all([
    payload.count({ collection: 'car-listings', where, overrideAccess: true }),
    payload.count({ collection: 'jobs', where, overrideAccess: true }),
  ])
  return cars.totalDocs + jobs.totalDocs
}

const toFields = (fd: FormData) => {
  const raw: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string') raw[k] = v
  return raw
}

const zodErrors = (issues: z.core.$ZodIssue[]) => {
  const out: Record<string, string> = {}
  for (const i of issues) out[String(i.path[0] ?? 'form')] ??= i.message
  return out
}

/** A free slug for a retitled listing (the old one goes to its slug history and redirects). */
async function freeSlug(payload: Payload, kind: Kind, title: string, id: number) {
  const base = slugify(title)
  for (let i = 1; i < 500; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const { totalDocs } = await payload.count({
      collection: COLLECTION[kind],
      where: { and: [{ slug: { equals: candidate } }, { id: { not_equals: id } }] },
      overrideAccess: true,
    })
    if (!totalDocs) return candidate
  }
  return `${base}-${Date.now()}`
}

/** Plain text → the job page's rich text, one paragraph per line break. */
const richFromText = (t?: string) => {
  const parts = (t ?? '').split(/\n+/).map((s) => s.trim()).filter(Boolean)
  return parts.length ? lexDoc(...parts.map(lexP)) : undefined
}

async function notifyTeam(payload: Payload, kind: Kind, title: string, id: number, customer: Customer, isEdit: boolean) {
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const notice = {
      title: `${isEdit ? 'Edited' : 'New'} ${kind === 'car' ? 'car listing' : 'job posting'} to review: ${title}`,
      lines: [
        ['From', `${customer.name} <${customer.email}>`],
        ['Phone', customer.phone],
      ] as [string, string | null | undefined][],
      adminUrl: absoluteUrl(`/admin/collections/${COLLECTION[kind]}/${id}`),
      photo: null,
    }
    await Promise.all([
      notifyTelegram(settings.telegramChatId, notice),
      notifyEmail(settings.notifyEmail || process.env.NOTIFY_EMAIL, notice),
    ])
  } catch (e) {
    console.error('[listings] could not notify the team', e)
  }
}

/** Create (no id) or edit (id) a customer's listing from the account form. */
export async function saveListing(customer: Customer, kind: Kind, fd: FormData, id?: number): Promise<ListingResult> {
  const payload = await payloadClient()
  const collection = COLLECTION[kind]

  let existing: CarListing | Job | null = null
  if (id) {
    existing = (await payload.findByID({ collection, id, depth: 0, overrideAccess: true, disableErrors: true })) as CarListing | Job | null
    if (!existing || ownerId(existing) !== customer.id) return fail(404, 'Listing not found.')
  }
  if ((await sentToday(payload, customer.id)) >= DAILY_SENDS) {
    return fail(429, 'You have sent many listings today. Please try again tomorrow.')
  }
  if (!existing || existing.status === 'draft' || existing.status === 'rejected') {
    const active = await activeCount(payload, customer.id, existing ? { kind, id: existing.id } : undefined)
    if (active >= ACTIVE_LIMIT) {
      return fail(400, `An account can have up to ${ACTIVE_LIMIT} live or waiting listings. Hide or delete one first.`)
    }
  }

  const parsed = (kind === 'car' ? carSchema : jobSchema).safeParse(toFields(fd))
  if (!parsed.success) return fail(400, 'Please check the highlighted fields.', zodErrors(parsed.error.issues))
  const d = parsed.data as Record<string, unknown>

  let carTitle = ''
  if (kind === 'car') {
    const make = await payload.findByID({ collection: 'car-makes', id: d.make as number, depth: 0, disableErrors: true })
    if (!make) return fail(400, 'Please check the highlighted fields.', { make: 'Choose a make' })
    if (make.models?.length && !make.models.includes(d.model as string)) {
      return fail(400, 'Please check the highlighted fields.', { model: 'Choose a model from the list' })
    }
    carTitle = `${d.year} ${make.name} ${d.model}`
  } else {
    const cat = await payload.findByID({ collection: 'job-categories', id: d.category as number, depth: 0, disableErrors: true })
    if (!cat) return fail(400, 'Please check the highlighted fields.', { category: 'Choose a category' })
    if (d.salaryMin != null && d.salaryMax != null && (d.salaryMax as number) < (d.salaryMin as number)) {
      return fail(400, 'Please check the highlighted fields.', { salaryMax: 'Maximum is below the minimum' })
    }
  }

  // Photos (cars): the ones kept from before, in the order the form sends them, then new uploads.
  let photos: number[] | undefined
  let removed: number[] = []
  if (kind === 'car') {
    const before = ((existing as CarListing | null)?.photos ?? []).map((m) => (typeof m === 'object' && m ? m.id : (m as number)))
    const keep = fd
      .getAll('keepPhotos')
      .map((v) => Number(v))
      .filter((v) => before.includes(v))
    removed = before.filter((v) => !keep.includes(v))
    const files = fd.getAll('photos').filter((f): f is File => typeof f === 'object' && f !== null && (f as File).size > 0)
    if (keep.length + files.length === 0) return fail(400, 'Please check the highlighted fields.', { photos: 'Add at least one photo' })
    if (keep.length + files.length > MAX_CAR_PHOTOS) {
      return fail(400, 'Please check the highlighted fields.', { photos: `Up to ${MAX_CAR_PHOTOS} photos` })
    }
    const bad = files.find((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES)
    if (bad) return fail(400, 'Please check the highlighted fields.', { photos: `${bad.name}: JPEG, PNG or WebP up to 10 MB only` })
    const added: number[] = []
    try {
      for (const f of files) {
        const data = Buffer.from(await f.arrayBuffer())
        const m = await payload.create({
          collection: 'media',
          overrideAccess: true,
          data: { alt: `${d.year} ${d.model} — photo` },
          file: { data, mimetype: f.type, name: f.name.replace(/[^\w.-]+/g, '-'), size: f.size },
        })
        added.push(m.id)
      }
    } catch (e) {
      console.error('[listings] could not store photos', e)
      for (const mid of added) await payload.delete({ collection: 'media', id: mid, overrideAccess: true }).catch(() => null)
      return fail(500, 'Could not upload the photos. Please try again.')
    }
    photos = [...keep, ...added]
  }

  const expiresAt = new Date(Date.now() + LISTING_DAYS * 86400000).toISOString()
  const common = { owner: customer.id, source: 'user' as const, status: 'pending' as const, moderationNote: null }
  const data =
    kind === 'car'
      ? {
          ...common,
          title: carTitle,
          make: d.make as number,
          model: d.model as string,
          year: d.year as number,
          price: d.price as number,
          mileage: d.mileage as number,
          engine: (d.engine as string) || null,
          transmission: d.transmission as CarListing['transmission'],
          fuelType: d.fuelType as CarListing['fuelType'],
          drivetrain: (d.drivetrain as CarListing['drivetrain']) ?? null,
          bodyType: d.bodyType as CarListing['bodyType'],
          exteriorColor: (d.exteriorColor as string) || null,
          vin: (d.vin as string) || null,
          description: (d.description as string) || null,
          sellerName: d.sellerName as string,
          sellerPhone: d.sellerPhone as string,
          photos,
          ...(existing ? {} : { expiresAt }),
        }
      : {
          ...common,
          title: d.title as string,
          companyName: d.companyName as string,
          category: d.category as number,
          employmentType: d.employmentType as Job['employmentType'],
          workMode: d.workMode as Job['workMode'],
          salaryMin: (d.salaryMin as number) ?? null,
          salaryMax: (d.salaryMax as number) ?? null,
          salaryPeriod: d.salaryPeriod as Job['salaryPeriod'],
          location: (d.location as string) || null,
          summary: (d.summary as string) || null,
          description: richFromText(d.description as string) ?? null,
          howToApply: d.howToApply as string,
          ...(existing ? {} : { expiresAt }),
        }

  const newTitle = (data as { title: string }).title
  if (existing && newTitle !== existing.title) Object.assign(data, { slug: await freeSlug(payload, kind, newTitle, existing.id) })

  let saved: CarListing | Job
  try {
    saved = (existing
      ? await payload.update({ collection, id: existing.id, data: data as never, overrideAccess: true, depth: 0 })
      : await payload.create({ collection, data: data as never, overrideAccess: true, depth: 0 })) as CarListing | Job
  } catch (e) {
    console.error('[listings] could not save', e)
    const msg = e instanceof Error ? e.message : ''
    return fail(400, msg && msg.length < 200 ? msg : 'Something went wrong on our side. Please try again in a minute.')
  }
  for (const mid of removed) await payload.delete({ collection: 'media', id: mid, overrideAccess: true }).catch(() => null)
  await notifyTeam(payload, kind, saved.title ?? '', saved.id, customer, Boolean(existing))
  return { ok: true, id: saved.id, message: 'Sent for review. We usually check new listings within a day — you will get an email.' }
}

export type ListingAction = 'hide' | 'show' | 'renew' | 'delete'

/** Hide (back to draft), show again (pending review), renew (+30 days) or delete. */
export async function listingAction(customer: Customer, kind: Kind, id: number, action: ListingAction): Promise<ListingResult> {
  const payload = await payloadClient()
  const collection = COLLECTION[kind]
  const doc = (await payload.findByID({ collection, id, depth: 0, overrideAccess: true, disableErrors: true })) as CarListing | Job | null
  if (!doc || ownerId(doc) !== customer.id) return fail(404, 'Listing not found.')
  const expiresAt = new Date(Date.now() + LISTING_DAYS * 86400000).toISOString()
  try {
    if (action === 'delete') {
      const photoIds = kind === 'car' ? ((doc as CarListing).photos ?? []).map((m) => (typeof m === 'object' && m ? m.id : (m as number))) : []
      await payload.delete({ collection, id, overrideAccess: true })
      for (const mid of photoIds) await payload.delete({ collection: 'media', id: mid, overrideAccess: true }).catch(() => null)
      return { ok: true, id, message: 'Deleted.' }
    }
    if (action === 'hide') {
      await payload.update({ collection, id, data: { status: 'draft' } as never, overrideAccess: true })
      return { ok: true, id, message: 'Hidden from the site.' }
    }
    if (action === 'show') {
      if (doc.status !== 'draft') return fail(400, 'Only a hidden listing can be shown again.')
      if ((await activeCount(payload, customer.id, { kind, id })) >= ACTIVE_LIMIT) {
        return fail(400, `An account can have up to ${ACTIVE_LIMIT} live or waiting listings. Hide or delete one first.`)
      }
      await payload.update({ collection, id, data: { status: 'pending', expiresAt } as never, overrideAccess: true })
      await notifyTeam(payload, kind, doc.title ?? '', id, customer, true)
      return { ok: true, id, message: 'Sent for review again.' }
    }
    // renew: live listings only; expired ones count as live again for another 30 days
    if (doc.status !== 'published') return fail(400, 'Only a published listing can be renewed.')
    await payload.update({ collection, id, data: { expiresAt } as never, overrideAccess: true })
    return { ok: true, id, message: `Renewed for ${LISTING_DAYS} days.` }
  } catch (e) {
    console.error('[listings] action failed', e)
    return fail(500, 'Something went wrong on our side. Please try again in a minute.')
  }
}

/** The account's cars and jobs, newest first, for the "My listings" page. */
export async function myListings(customerId: number) {
  const payload = await payloadClient()
  const [cars, jobs] = await Promise.all([
    payload.find({ collection: 'car-listings', where: { owner: { equals: customerId } }, sort: '-updatedAt', depth: 1, limit: 100, overrideAccess: true }),
    payload.find({ collection: 'jobs', where: { owner: { equals: customerId } }, sort: '-updatedAt', depth: 0, limit: 100, overrideAccess: true }),
  ])
  return { cars: cars.docs, jobs: jobs.docs }
}
