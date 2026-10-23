import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

// The signed-in site customer (stage 3), read from Payload's auth cookie on the
// server. A team member signed in to /admin is not a customer and gets null.
//
// Used only by account pages (server components). Payload's cookie check drops the
// login cookie on a request that comes from another site (Sec-Fetch-Site: cross-site)
// as CSRF protection — so a buyer sent back from Stripe Checkout landed on "Log in"
// although still signed in (client, 22.10.2026: "it throws you out after paying").
// Opening a page (Sec-Fetch-Mode: navigate) changes nothing, and a SameSite=Lax
// cookie only travels cross-site on such top-level navigations anyway, so for a page
// navigation the request is treated as same-site. API routes and form posts keep the
// full check — they don't go through here.
export async function getCustomer(): Promise<Customer | null> {
  const payload = await getPayload({ config })
  const h = await headers()
  const authHeaders = new Headers(h)
  if (h.get('sec-fetch-mode') === 'navigate' && h.get('sec-fetch-site') === 'cross-site') {
    authHeaders.set('sec-fetch-site', 'same-site')
  }
  try {
    const { user } = await payload.auth({ headers: authHeaders })
    return user && user.collection === 'customers' ? (user as Customer) : null
  } catch {
    return null
  }
}
