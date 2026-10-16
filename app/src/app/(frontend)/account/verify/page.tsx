import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import { AccountShell } from '@/components/account/AccountShell'

export const metadata: Metadata = { title: 'Confirm your email' }

type Props = { searchParams: Promise<{ token?: string }> }

// The link from the sign-up email. Confirms the account on the server, then
// offers to log in.
export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams
  let ok = false
  if (token) {
    try {
      const payload = await getPayload({ config })
      ok = await payload.verifyEmail({ collection: 'customers', token })
    } catch {
      ok = false
    }
  }
  return (
    <AccountShell middle title={ok ? 'Email confirmed' : 'Link not valid'}>
      {ok ? (
        <div className="m-0">
          Your account is ready.{' '}
          <Link href="/account/login" className="text-brand-navy underline">
            Log in
          </Link>{' '}
          to post your first listing.
        </div>
      ) : (
        <div className="m-0">
          This confirmation link has expired or was already used. If you confirmed before, just{' '}
          <Link href="/account/login" className="text-brand-navy underline">
            log in
          </Link>
          .
        </div>
      )}
    </AccountShell>
  )
}
