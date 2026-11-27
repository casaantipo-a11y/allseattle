import config from '@payload-config'
import { randomBytes } from 'node:crypto'
import { getPayload, ValidationError, type Payload, type Where } from 'payload'
import type { z } from 'zod'

import type { Customer } from '@/payload-types'

import { doc as lexDoc, p as lexP } from '../scripts/lexical'
import { MAX_BYTES, PHOTO_TYPES, badPhoto } from './forms'
import { notifyEmail, notifyTelegram } from './notify'
import { absoluteUrl } from './site'

// Server helpers shared by the account's write routes (stage 3): listings
// (lib/listings.ts) and businesses (lib/business-cabinet.ts). They all use the
// local API with the ownership checks in code — the collections' REST write
// access stays team-only.

export type CabinetResult =
  | { ok: true; id: number; message: string }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> }

export const fail = (status: number, error: string, fieldErrors?: Record<string, string>): CabinetResult => ({ ok: false, status, error, fieldErrors })
export const CHECK = 'Please check the highlighted fields.'

/** Saves (create or edit) an account may make per 24 hours, cars, jobs and businesses together. */
const DAILY_SENDS = 10
/** The same for an account that owns a published business: a dealer lists a whole lot at a time. */
const DAILY_SENDS_BUSINESS = 50

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

export const relId = (v: unknown): number | null =>
  typeof v === 'number' ? v : typeof v === 'object' && v && 'id' in v ? (v as { id: number }).id : null

export const isOwner = (doc: { owner?: unknown }, customer: Customer) => relId(doc.owner) === customer.id

/** True when the account has used up today's saves. */
export async function overDailyLimit(payload: Payload, customerId: number) {
  const owns = await payload.count({
    collection: 'businesses',
    where: { and: [{ owner: { equals: customerId } }, { status: { equals: 'published' } }] },
    overrideAccess: true,
  })
  const limit = owns.totalDocs > 0 ? DAILY_SENDS_BUSINESS : DAILY_SENDS
  const since = new Date(Date.now() - 86400000).toISOString()
  const where: Where = { and: [{ owner: { equals: customerId } }, { updatedAt: { greater_than: since } }] }
  const counts = await Promise.all(
    (['car-listings', 'jobs', 'businesses'] as const).map((collection) => payload.count({ collection, where, overrideAccess: true })),
  )
  return counts.reduce((n, c) => n + c.totalDocs, 0) >= limit
}

export const DAILY_LIMIT_ERROR = 'You have sent a lot today. Please try again tomorrow.'

/** Every save notifies the team, so one document is saved at most every 30 seconds. */
const SAVE_GAP_MS = 30 * 1000
export const tooSoon = (doc: { updatedAt?: string | null } | null | undefined) =>
  Boolean(doc?.updatedAt && Date.now() - new Date(doc.updatedAt).getTime() < SAVE_GAP_MS)
export const TOO_SOON_ERROR = 'Saved a moment ago — please wait half a minute before saving again.'

/**
 * The form's text fields. A NUL character is dropped: Postgres refuses it in text (a 500 otherwise).
 * A line break is one `\n`: a browser (and Node) sends a textarea's lines as CRLF in a multipart body, and
 * an unchanged description is recognised by comparing it with the stored text (`saveBusiness`).
 */
export const toFields = (fd: FormData) => {
  const raw: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string') raw[k] = v.replaceAll('\u0000', '').replace(/\r\n?/g, '\n')
  return raw
}

export const zodErrors = (issues: z.core.$ZodIssue[]) => {
  const out: Record<string, string> = {}
  for (const i of issues) out[String(i.path[0] ?? 'form')] ??= i.message
  return out
}

/** A save that failed: a collection hook's ValidationError ("Luxury package allows up to
 *  10 categories") goes back to its field; anything else is logged. */
export function saveFailed(e: unknown, where: string): CabinetResult {
  // `instanceof` alone fails in the production build: Payload throws its own copy of the class,
  // so the check is also made by shape (400 + a list of field errors). The error's name is no
  // help either — it is the minified constructor name there.
  const shaped = (x: unknown) => {
    const d = x as { status?: unknown; data?: { errors?: unknown } } | null
    return typeof x === 'object' && x !== null && d?.status === 400 && Array.isArray(d.data?.errors)
  }
  if (e instanceof ValidationError || shaped(e)) {
    const errors = ((e as ValidationError).data?.errors ?? []) as { path?: string; message?: string }[]
    const fieldErrors: Record<string, string> = {}
    for (const er of errors) if (er.path && er.message) fieldErrors[er.path] ??= er.message
    return fail(400, errors[0]?.message ?? CHECK, fieldErrors)
  }
  console.error(`[${where}] could not save`, e)
  return fail(500, 'Something went wrong on our side. Please try again in a minute.')
}

/** Where the team's notices go: Site Settings, else NOTIFY_EMAIL. */
export const teamEmail = (settings: { notifyEmail?: string | null }) => settings.notifyEmail || process.env.NOTIFY_EMAIL || null

/** The team's address for a client's "reply" (payment-link mails): the one notices go to. */
export async function teamReplyTo(payload: Payload): Promise<string | undefined> {
  try {
    return teamEmail(await payload.findGlobal({ slug: 'site-settings', depth: 0 })) ?? undefined
  } catch {
    return process.env.NOTIFY_EMAIL || undefined
  }
}

/** Who a notice is from: a site account, or just a name and an email (a payment-link buyer has no account). */
export type NoticeFrom = { name: string; email: string; phone?: string | null }

/** A notice to the team (Telegram and email, when set in Site Settings) with the admin link. */
export async function notifyTeam(payload: Payload, title: string, adminPath: string, from: NoticeFrom) {
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const notice = {
      title,
      lines: [
        ['From', `${from.name} <${from.email}>`],
        ['Phone', from.phone],
      ] as [string, string | null | undefined][],
      adminUrl: absoluteUrl(adminPath),
      photo: null,
    }
    await Promise.all([notifyTelegram(settings.telegramChatId, notice), notifyEmail(teamEmail(settings), notice)])
  } catch (e) {
    console.error('[cabinet] could not notify the team', e)
  }
}

/** `staged`: ids uploaded on their own beforehand (POST /api/account/photos) and now claimed by this save. */
export type PhotoChange = { ids: number[]; added: number[]; removed: number[]; staged?: number[]; alt?: string }

/** One uploaded photo into Media, marked as the account's own (and `staged` for a standalone upload). */
export async function storePhoto(payload: Payload, customer: Customer, f: File, alt: string, staged = false) {
  return payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt, uploadedBy: customer.id, ...(staged ? { staged: true } : {}) } as never,
    // A random prefix: two photos named alike uploaded at the same moment (two workers of the car form,
    // or two phones' "image.jpg") would otherwise race for the same stored file name and one would fail.
    file: { data: Buffer.from(await f.arrayBuffer()), mimetype: f.type, name: `${randomBytes(4).toString('hex')}-${f.name.replace(/[^\w.-]+/g, '-')}`, size: f.size },
  })
}

/** Photos one account may upload on their own (the car form sends them one by one): per 10 minutes and per day. */
const PHOTO_BURST = 60
const PHOTO_DAILY = 400
export const PHOTO_LIMIT_ERROR = 'You have uploaded a lot of photos. Please wait a few minutes and try again.'

/**
 * Is the account at its photo limit? Asked before a photo is stored (`mineId` left out: the photos
 * so far already fill the limit) and again right after (`mineId` = the new photo: it is over only
 * if more photos than the limit came before it or with it, by id). The second check is what stops
 * a burst of parallel requests that all passed the first one.
 */
export async function overPhotoLimit(payload: Payload, customerId: number, mineId?: number) {
  const count = (ms: number) =>
    payload.count({
      collection: 'media',
      where: {
        and: [
          { uploadedBy: { equals: customerId } },
          { createdAt: { greater_than: new Date(Date.now() - ms).toISOString() } },
          ...(mineId ? [{ id: { less_than_equal: mineId } }] : []),
        ],
      },
      overrideAccess: true,
    })
  const [burst, day] = await Promise.all([count(10 * 60 * 1000), count(86400000)])
  return mineId ? burst.totalDocs > PHOTO_BURST || day.totalDocs > PHOTO_DAILY : burst.totalDocs >= PHOTO_BURST || day.totalDocs >= PHOTO_DAILY
}

/**
 * An upload field of an account form: `<field>Keep` lists the ids kept from
 * `before` (in their new order), `<field>` carries new files. New files are
 * stored in Media (marked uploadedBy) right away; the caller saves the document
 * and then calls `settlePhotos` — which drops the new files if that save failed,
 * or the removed ones if it worked.
 *
 * With `opts.staged` (the car form) `<field>Keep` may also hold ids of photos the
 * account uploaded earlier through POST /api/account/photos: they must be this
 * account's and still `staged` (not yet claimed by a listing), else the save is
 * refused. A failed save leaves them staged so the form can send them again.
 */
export async function takePhotos(
  payload: Payload,
  customer: Customer,
  fd: FormData,
  field: string,
  before: number[],
  opts: { max: number; min?: number; alt: string; staged?: boolean },
): Promise<{ ok: true; change: PhotoChange } | { ok: false; result: CabinetResult }> {
  const bad = (msg: string) => ({ ok: false as const, result: fail(400, CHECK, { [field]: msg }) })
  const sent = [...new Set(fd.getAll(`${field}Keep`).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0 && n <= 2147483647))]
  const fresh = opts.staged ? sent.filter((v) => !before.includes(v)) : []
  if (fresh.length > opts.max) return bad(opts.max === 1 ? 'Only one picture here' : `Up to ${opts.max} photos`)
  if (fresh.length) {
    const found = await payload.find({
      collection: 'media',
      where: { and: [{ id: { in: fresh } }, { uploadedBy: { equals: customer.id } }, { staged: { equals: true } }] },
      depth: 0,
      limit: fresh.length,
      pagination: false,
      overrideAccess: true,
    })
    if (found.docs.length < fresh.length) return bad('A photo is no longer available — please add it again')
  }
  const keep = sent.filter((v) => before.includes(v) || fresh.includes(v))
  const files = fd.getAll(field).filter((f): f is File => typeof f === 'object' && f !== null && (f as File).size > 0)
  const total = keep.length + files.length
  if (opts.min && total < opts.min) return bad(opts.min === 1 ? 'Add at least one photo' : `Add at least ${opts.min} photos`)
  if (total > opts.max) return bad(opts.max === 1 ? 'Only one picture here' : `Up to ${opts.max} photos`)
  const wrong = files.find((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES)
  if (wrong) return bad(`${wrong.name}: JPEG, PNG or WebP up to 10 MB only`)
  for (const f of files) {
    if (await badPhoto(f)) return bad(`${f.name}: the picture can't be read, or it is not a JPEG, PNG or WebP`)
  }
  const added: number[] = []
  try {
    for (const f of files) added.push((await storePhoto(payload, customer, f, opts.alt)).id)
  } catch (e) {
    console.error('[cabinet] could not store photos', e)
    await dropMedia(payload, customer, added)
    return { ok: false, result: fail(500, 'Could not upload the photos. Please try again.') }
  }
  return { ok: true, change: { ids: [...keep, ...added], added, removed: before.filter((v) => !keep.includes(v)), staged: fresh, alt: opts.alt } }
}

/** After the save: drop the files that are no longer used (only the account's own uploads). */
export async function settlePhotos(payload: Payload, customer: Customer, changes: PhotoChange[], saved: boolean) {
  await dropMedia(payload, customer, changes.flatMap((c) => (saved ? c.removed : c.added)))
  if (!saved) return
  // The listing now holds the staged photos: they are no longer "waiting" and the daily cleanup leaves them.
  for (const c of changes) {
    if (!c.staged?.length) continue
    await payload
      .update({
        collection: 'media',
        where: { and: [{ id: { in: c.staged } }, { uploadedBy: { equals: customer.id } }] },
        data: { staged: false, ...(c.alt ? { alt: c.alt } : {}) } as never,
        overrideAccess: true,
      })
      .catch((e) => console.error('[cabinet] could not release staged photos', e))
  }
}

async function dropMedia(payload: Payload, customer: Customer, ids: number[]) {
  if (!ids.length) return
  await payload
    .delete({ collection: 'media', where: { and: [{ id: { in: ids } }, { uploadedBy: { equals: customer.id } }] }, overrideAccess: true })
    .catch((e) => console.error('[cabinet] could not delete photos', e))
}

/** Ids of an upload field's value (hasMany or single). */
export const mediaIds = (v: unknown): number[] =>
  (Array.isArray(v) ? v : v == null ? [] : [v]).map(relId).filter((x): x is number => x != null)

/** Plain text from an account form → rich text, one paragraph per line. */
export const richFromText = (t?: string) => {
  const parts = (t ?? '').split(/\n+/).map((s) => s.trim()).filter(Boolean)
  return parts.length ? lexDoc(...parts.map(lexP)) : undefined
}
