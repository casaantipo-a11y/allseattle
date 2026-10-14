import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { HONEYPOT, clientIp, turnstileOk } from '@/lib/forms'

// POST /api/account/register — sign-up for a site account (stage 3). The only way
// to create a customer: the REST create is closed (collections/Customers.ts).
// Honeypot → validation → Turnstile → 5 sign-ups per IP per hour → create. Payload
// then emails the confirmation link; the account can log in once it is confirmed.

const RATE_LIMIT = 5

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.email('That doesn’t look like an email address').trim().toLowerCase(),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine((v) => !v || v.replace(/\D/g, '').length >= 7, 'Enter a phone number with at least 7 digits'),
})

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request) {
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the form.' }, 400)
  }
  const ok = { ok: true, message: 'Almost done — we sent you an email. Open the link in it to confirm your account.' }
  if (typeof fd.get(HONEYPOT) === 'string' && (fd.get(HONEYPOT) as string).trim() !== '') return json(ok)

  const raw: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (typeof v === 'string') raw[k] = v
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message
    return json({ error: 'Please check the highlighted fields.', fieldErrors }, 400)
  }

  const ip = clientIp(req)
  if (!(await turnstileOk(fd.get('cf-turnstile-response'), ip))) {
    return json({ error: 'The anti-spam check failed. Please try again.' }, 400)
  }

  const payload = await getPayload({ config })
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
  const { totalDocs } = await payload.count({
    collection: 'customers',
    where: { and: [{ signupIp: { equals: ip } }, { createdAt: { greater_than: hourAgo } }] },
    overrideAccess: true,
  })
  if (ip !== 'unknown' && totalDocs >= RATE_LIMIT) {
    return json({ error: 'Too many sign-ups from your connection. Please try again in an hour.' }, 429)
  }

  const d = parsed.data
  const exists = await payload.count({ collection: 'customers', where: { email: { equals: d.email } }, overrideAccess: true })
  if (exists.totalDocs) {
    return json({ error: 'Please check the highlighted fields.', fieldErrors: { email: 'An account with this email already exists. Log in or reset the password.' } }, 400)
  }
  try {
    await payload.create({
      collection: 'customers',
      overrideAccess: true,
      data: { name: d.name, email: d.email, password: d.password, phone: d.phone || undefined, signupIp: ip },
    })
  } catch (e) {
    console.error('[account] sign-up failed', e)
    return json({ error: 'Something went wrong on our side. Please try again in a minute.' }, 500)
  }
  return json(ok)
}
