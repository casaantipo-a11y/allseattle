import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountForm } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'
import { getCustomer } from '@/lib/account'

export const metadata: Metadata = { title: 'Create an account' }

export default async function RegisterPage() {
  if (await getCustomer()) redirect('/account')
  return (
    <AccountShell
      title="Create an account"
      intro={
        <>
          Already have one?{' '}
          <Link href="/account/login" className="text-brand-navy underline">
            Log in
          </Link>
          .
        </>
      }
    >
      <AccountForm mode="register" turnstileSiteKey={process.env.TURNSTILE_SITE_KEY} />
    </AccountShell>
  )
}
