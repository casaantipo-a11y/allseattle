import type { Metadata } from 'next'
import Link from 'next/link'

import { AccountForm } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'

export const metadata: Metadata = { title: 'Choose a new password' }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <AccountShell title="Choose a new password">
      {token ? (
        <AccountForm mode="reset" token={token} />
      ) : (
        <p>
          This link is incomplete.{' '}
          <Link href="/account/forgot" className="text-brand-navy underline">
            Ask for a new one
          </Link>
          .
        </p>
      )}
    </AccountShell>
  )
}
