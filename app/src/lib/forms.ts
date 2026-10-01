import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { type NoticePhoto, notifyEmail, notifyTelegram } from './notify'
import { absoluteUrl } from './site'

// Server side of the public forms (spec §8). Each form is a zod schema plus a
// mapping to a Submissions document; `handleForm` does the rest in a fixed
// order: honeypot → validation → Turnstile → rate limit → save → notify.

export const HONEYPOT = 'company_fax' // hidden field; people never fill it, bots do
const RATE_LIMIT = 5 // per IP per hour

const contact = {
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.union([z.literal(''), z.email('That doesn’t look like an email address')]).optional(),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine(
      (v) => !v || v.replace(/\D/g, '').length >= 7,
      'Enter a phone number with at least 7 digits',
    ),
  message: z.string().trim().max(2000, 'Please keep it under 2000 characters').optional(),
}
const needContact = (d: { email?: string; phone?: string }) => Boolean(d.email || d.phone)
const idOpt = z
  .string()
  .optional()
  .transform((v) => (v && /^\d+$/.test(v) ? Number(v) : undefined))

export const FORMS = {
  'business-registration': {
    type: 'business_registration' as const,
    schema: z
      .object({
        businessName: z.string().trim().min(2, 'Please enter the business name').max(120),
        category: idOpt,
        desiredPackage: idOpt,
        ...contact,
      })
      .refine(needContact, { message: 'Leave an email or a phone number', path: ['email'] }),
    thanks: 'Thanks! We received your business details and will contact you shortly.',
    title: 'New business registration',
  },
  'ad-inquiry': {
    type: 'ad_inquiry' as const,
    schema: z
      .object({
        businessName: z.string().trim().max(120).optional(),
        desiredPackage: idOpt,
        desiredSlot: z.string().trim().max(120).optional(),
        ...contact,
      })
      .refine(needContact, { message: 'Leave an email or a phone number', path: ['email'] }),
    thanks: 'Thanks! We received your request and will get back to you with options.',
    title: 'New advertising inquiry',
  },
  'news-tip': {
    type: 'news_tip' as const,
    schema: z
      .object({
        ...contact,
        message: z.string().trim().min(10, 'Tell us a bit more — at least a sentence').max(5000, 'Please keep it under 5000 characters'),
        location: z.string().trim().max(200).optional(),
      })
      .refine(needContact, { message: 'Leave an email or a phone number', path: ['email'] }),
    thanks: 'Thanks! We received your news tip and will review it shortly.',
    title: 'New news tip',
  },
} as const

// Photos for news tips (spec §8): up to 5, JPEG/PNG/WebP, 10 MB each.
const MAX_PHOTOS = 5
const MAX_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type FormKey = keyof typeof FORMS

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim()
}

async function turnstileOk(token: FormDataEntryValue | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured: honeypot and rate limit still apply
  if (typeof token !== 'string' || !token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function handleForm(key: FormKey, req: Request): Promise<Response> {
  const form = FORMS[key]
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form.' }, 400)
  }

  // A bot filled the hidden field: pretend it worked, store nothing.
  if (typeof fd.get(HONEYPOT) === 'string' && (fd.get(HONEYPOT) as string).trim() !== '') {
    return json({ ok: true, message: form.thanks })
  }

  const raw: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string') raw[k] = v
  const parsed = form.schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0] ?? 'form')
      fieldErrors[path] ??= issue.message
    }
    return json({ error: 'Please check the highlighted fields.', fieldErrors }, 400)
  }

  const files = fd.getAll('photos').filter((f): f is File => typeof f === 'object' && f !== null && (f as File).size > 0)
  if (files.length) {
    if (form.type !== 'news_tip') return json({ error: 'This form doesn’t take files.' }, 400)
    if (files.length > MAX_PHOTOS) return json({ error: 'Please check the highlighted fields.', fieldErrors: { photos: `Up to ${MAX_PHOTOS} photos` } }, 400)
    const bad = files.find((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES)
    if (bad) {
      return json(
        { error: 'Please check the highlighted fields.', fieldErrors: { photos: `${bad.name}: JPEG, PNG or WebP up to 10 MB only` } },
        400,
      )
    }
  }

  const ip = clientIp(req)
  if (!(await turnstileOk(fd.get('cf-turnstile-response'), ip))) {
    return json({ error: 'The anti-spam check failed. Please try again.' }, 400)
  }

  const payload = await getPayload({ config })
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
  const { totalDocs } = await payload.count({
    collection: 'submissions',
    where: { and: [{ ip: { equals: ip } }, { createdAt: { greater_than: hourAgo } }] },
    overrideAccess: true,
  })
  if (ip !== 'unknown' && totalDocs >= RATE_LIMIT) {
    return json(
      { error: 'Too many requests from your connection. Please try again in an hour.' },
      429,
    )
  }

  const d = parsed.data as Record<string, unknown>
  // Ids come from the visitor's browser: keep them only if they exist.
  const exists = async (collection: 'business-categories' | 'packages', id: unknown) =>
    typeof id === 'number' &&
    (await payload.find({ collection, where: { id: { equals: id } }, limit: 1, depth: 0 }))
      .totalDocs > 0
      ? id
      : undefined
  d.category = await exists('business-categories', d.category)
  d.desiredPackage = await exists('packages', d.desiredPackage)

  // Photos go into Media first (resized to WebP like every upload), then the
  // submission points at them.
  const photoIds: number[] = []
  let firstPhoto: NoticePhoto | null = null
  try {
    for (const f of files) {
      const data = Buffer.from(await f.arrayBuffer())
      const m = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: `News tip photo from ${String(d.name).slice(0, 60)}` },
        file: { data, mimetype: f.type, name: f.name.replace(/[^\w.-]+/g, '-'), size: f.size },
      })
      photoIds.push(m.id)
      firstPhoto ??= { data, name: f.name, mimetype: f.type }
    }
  } catch (e) {
    console.error('[forms] could not store photos', e)
    return json({ error: 'Could not upload the photos. Please try again.' }, 500)
  }

  let doc
  try {
    doc = await payload.create({
      collection: 'submissions',
      overrideAccess: true,
      data: {
        type: form.type,
        status: 'new',
        name: d.name as string,
        email: (d.email as string) || undefined,
        phone: (d.phone as string) || undefined,
        message: (d.message as string) || undefined,
        businessName: (d.businessName as string) || undefined,
        category: (d.category as number) || undefined,
        desiredPackage: (d.desiredPackage as number) || undefined,
        desiredSlot: (d.desiredSlot as string) || undefined,
        location: (d.location as string) || undefined,
        photos: photoIds.length ? photoIds : undefined,
        ip,
        userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? undefined,
      },
      depth: 1,
    })
  } catch (e) {
    console.error('[forms] could not save submission', e)
    return json({ error: 'Something went wrong on our side. Please try again in a minute.' }, 500)
  }

  // Notifications must never lose a saved submission.
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const pkg = typeof doc.desiredPackage === 'object' ? doc.desiredPackage?.name : undefined
    const cat = typeof doc.category === 'object' ? doc.category?.name : undefined
    const notice = {
      title: `${form.title}${doc.businessName ? `: ${doc.businessName}` : ''}`,
      lines: [
        ['Name', doc.name],
        ['Email', doc.email],
        ['Phone', doc.phone],
        ['Business', doc.businessName],
        ['Category', cat],
        ['Package', pkg],
        ['Placement', doc.desiredSlot],
        ['Location', doc.location],
        ['Photos', photoIds.length ? String(photoIds.length) : null],
        ['Message', doc.message],
      ] as [string, string | null | undefined][],
      adminUrl: absoluteUrl(`/admin/collections/submissions/${doc.id}`),
      photo: firstPhoto,
    }
    await Promise.all([
      notifyTelegram(settings.telegramChatId, notice),
      notifyEmail(settings.notifyEmail || process.env.NOTIFY_EMAIL, notice),
    ])
  } catch (e) {
    console.error('[forms] notification step failed', e)
  }

  return json({ ok: true, message: form.thanks })
}
