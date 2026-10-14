import config from '@payload-config'
import { getPayload, ValidationError, type Payload, type Where } from 'payload'
import type { z } from 'zod'

import type { Customer } from '@/payload-types'

import { doc as lexDoc, p as lexP } from '../scripts/lexical'
import { MAX_BYTES, PHOTO_TYPES } from './forms'
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
  const since = new Date(Date.now() - 86400000).toISOString()
  const where: Where = { and: [{ owner: { equals: customerId } }, { updatedAt: { greater_than: since } }] }
  const counts = await Promise.all(
    (['car-listings', 'jobs', 'businesses'] as const).map((collection) => payload.count({ collection, where, overrideAccess: true })),
  )
  return counts.reduce((n, c) => n + c.totalDocs, 0) >= DAILY_SENDS
}

export const DAILY_LIMIT_ERROR = 'You have sent a lot today. Please try again tomorrow.'

/** Every save notifies the team, so one document is saved at most every 30 seconds. */
const SAVE_GAP_MS = 30 * 1000
export const tooSoon = (doc: { updatedAt?: string | null } | null | undefined) =>
  Boolean(doc?.updatedAt && Date.now() - new Date(doc.updatedAt).getTime() < SAVE_GAP_MS)
export const TOO_SOON_ERROR = 'Saved a moment ago — please wait half a minute before saving again.'

export const toFields = (fd: FormData) => {
  const raw: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string') raw[k] = v
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
  if (e instanceof ValidationError) {
    const errors = (e.data?.errors ?? []) as { path?: string; message?: string }[]
    const fieldErrors: Record<string, string> = {}
    for (const er of errors) if (er.path && er.message) fieldErrors[er.path] ??= er.message
    return fail(400, errors[0]?.message ?? CHECK, fieldErrors)
  }
  console.error(`[${where}] could not save`, e)
  return fail(500, 'Something went wrong on our side. Please try again in a minute.')
}

/** A notice to the team (Telegram and email, when set in Site Settings) with the admin link. */
export async function notifyTeam(payload: Payload, title: string, adminPath: string, customer: Customer) {
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const notice = {
      title,
      lines: [
        ['From', `${customer.name} <${customer.email}>`],
        ['Phone', customer.phone],
      ] as [string, string | null | undefined][],
      adminUrl: absoluteUrl(adminPath),
      photo: null,
    }
    await Promise.all([notifyTelegram(settings.telegramChatId, notice), notifyEmail(settings.notifyEmail || process.env.NOTIFY_EMAIL, notice)])
  } catch (e) {
    console.error('[cabinet] could not notify the team', e)
  }
}

export type PhotoChange = { ids: number[]; added: number[]; removed: number[] }

/**
 * An upload field of an account form: `<field>Keep` lists the ids kept from
 * `before` (in their new order), `<field>` carries new files. New files are
 * stored in Media (marked uploadedBy) right away; the caller saves the document
 * and then calls `settlePhotos` — which drops the new files if that save failed,
 * or the removed ones if it worked.
 */
export async function takePhotos(
  payload: Payload,
  customer: Customer,
  fd: FormData,
  field: string,
  before: number[],
  opts: { max: number; min?: number; alt: string },
): Promise<{ ok: true; change: PhotoChange } | { ok: false; result: CabinetResult }> {
  const bad = (msg: string) => ({ ok: false as const, result: fail(400, CHECK, { [field]: msg }) })
  const keep = fd
    .getAll(`${field}Keep`)
    .map(Number)
    .filter((v) => before.includes(v))
  const files = fd.getAll(field).filter((f): f is File => typeof f === 'object' && f !== null && (f as File).size > 0)
  const total = keep.length + files.length
  if (opts.min && total < opts.min) return bad(opts.min === 1 ? 'Add at least one photo' : `Add at least ${opts.min} photos`)
  if (total > opts.max) return bad(opts.max === 1 ? 'Only one picture here' : `Up to ${opts.max} photos`)
  const wrong = files.find((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES)
  if (wrong) return bad(`${wrong.name}: JPEG, PNG or WebP up to 10 MB only`)
  const added: number[] = []
  try {
    for (const f of files) {
      const m = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: opts.alt, uploadedBy: customer.id },
        file: { data: Buffer.from(await f.arrayBuffer()), mimetype: f.type, name: f.name.replace(/[^\w.-]+/g, '-'), size: f.size },
      })
      added.push(m.id)
    }
  } catch (e) {
    console.error('[cabinet] could not store photos', e)
    await dropMedia(payload, customer, added)
    return { ok: false, result: fail(500, 'Could not upload the photos. Please try again.') }
  }
  return { ok: true, change: { ids: [...keep, ...added], added, removed: before.filter((v) => !keep.includes(v)) } }
}

/** After the save: drop the files that are no longer used (only the account's own uploads). */
export async function settlePhotos(payload: Payload, customer: Customer, changes: PhotoChange[], saved: boolean) {
  await dropMedia(payload, customer, changes.flatMap((c) => (saved ? c.removed : c.added)))
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
