import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { sendPaymentLink } from '@/lib/payment-link'

// POST /api/admin/payment-link { businessId, packageId, email } — the "Send payment link"
// button of a business in the admin (lib/payment-link.ts). Admin and sales only, checked
// against the admin session cookie; a site account (customers) is refused.

export async function POST(req: Request) {
  // The session is a cookie: only our own admin page (JSON, same host) may use it.
  if (!req.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Send JSON.' }, { status: 415 })
  const origin = req.headers.get('origin')
  const sameHost = (o: string) => {
    try {
      return new URL(o).host === req.headers.get('host')
    } catch {
      return false // "null" and other junk
    }
  }
  if (origin && !sameHost(origin)) return Response.json({ error: 'Forbidden' }, { status: 403 })
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
