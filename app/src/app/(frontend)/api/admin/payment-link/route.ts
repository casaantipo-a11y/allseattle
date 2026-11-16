import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { sendPaymentLink } from '@/lib/payment-link'

const sameHost = (origin: string, host: string | null) => {
  try {
    return new URL(origin).host === host
  } catch {
    return false // "null" and other junk
  }
}

// POST /api/admin/payment-link { businessId, packageId, email } — the "Send payment link"
// button of a business in the admin (lib/payment-link.ts). Admin and sales only, checked
// against the admin session cookie; a site account (customers) is refused.

export async function POST(req: Request) {
  // The session is a cookie, so only our own admin page may use it: JSON, from this very host.
  // A browser always sends Origin on such a POST (and Sec-Fetch-Site); anything without either is not the admin page.
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({ error: 'Send JSON.' }, { status: 415 })
  const origin = req.headers.get('origin')
  const sameOrigin = origin ? sameHost(origin, req.headers.get('host')) : req.headers.get('sec-fetch-site') === 'same-origin'
  if (!sameOrigin) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return Response.json({ error: 'Sign in to the admin first.' }, { status: 401 })
  if (!hasRole({ user } as unknown as PayloadRequest, 'admin', 'sales')) return Response.json({ error: 'Only admin and sales can send payment links.' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as { businessId?: unknown; packageId?: unknown; email?: unknown } | null
  const businessId = Number(body?.businessId)
  const packageId = Number(body?.packageId)
  if (!Number.isInteger(businessId) || !Number.isInteger(packageId) || typeof body?.email !== 'string') return Response.json({ error: 'Business, package and email are required.' }, { status: 400 })

  const result = await sendPaymentLink({ businessId, packageId, email: body.email })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ ok: true, message: result.message, sentTo: result.sentTo, sentAt: result.sentAt })
}
