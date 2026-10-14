import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

// The signed-in site customer (stage 3), read from Payload's auth cookie on the
// server. A team member signed in to /admin is not a customer and gets null.
export async function getCustomer(): Promise<Customer | null> {
  const payload = await getPayload({ config })
  try {
    const { user } = await payload.auth({ headers: await headers() })
    return user && user.collection === 'customers' ? (user as Customer) : null
  } catch {
    return null
  }
}
