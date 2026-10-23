import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccountForm } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'
import { getCustomer } from '@/lib/account'

export const metadata: Metadata = { title: 'Log in' }

type Props = { searchParams: Promise<{ next?: string }> }

// Only paths on this site, so the link can't send someone elsewhere after login.
const safeNext = (n?: string) => (n && /^\/(?![/\\])/.test(n) ? n : '/account')

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next)
  if (await getCustomer()) redirect(next)
  return (
    <AccountShell
      middle
      title="Log in"
      intro={
        <>
          New here?{' '}
          <Link href={`/account/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="account-switch">
            Create an account
          </Link>{' '}
          — it takes a minute and lets you post cars and jobs.
        </>
      }
    >
      {/* Sent here on the way back from Stripe (signed out meanwhile): say the payment went
          through before asking to log in (client, 22.10.2026). */}
      {/[?&]paid=1(&|$)/.test(next) ? (
        <div className="success-panel mb-6" role="status">
          <div>Payment received ✓ Thank you! Log in to see it in your account.</div>
        </div>
      ) : null}
      <AccountForm mode="login" next={next} />
    </AccountShell>
  )
}
