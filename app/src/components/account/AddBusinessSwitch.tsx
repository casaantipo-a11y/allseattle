'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

// /add-business is a cached page, so who is looking is found out here: a
// signed-in site customer registers the business from the account (stage 3,
// step 3) instead of sending the application form, which stays for guests.
export function AddBusinessSwitch({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    fetch('/api/customers/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { user?: unknown } | null) => setSignedIn(Boolean(b?.user)))
      .catch(() => {})
  }, [])

  if (signedIn) {
    return (
      <div>
        <h2>You’re signed in</h2>
        <div className="mb-6">Register the business from your account: you fill in the page yourself, and it goes live after a quick check.</div>
        <Link href="/account/business/new" className="btn btn-lg btn-block">
          Register a business
        </Link>
        <div className="mb-0 mt-4 text-sm">
          <Link href="/account/business" className="text-brand-navy underline">
            My business
          </Link>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="mb-6 text-sm">
        Want to fill in the page yourself?{' '}
        <Link href={`/account/login?next=${encodeURIComponent('/account/business/new')}`} className="text-brand-navy underline">
          Log in
        </Link>{' '}
        or{' '}
        <Link href="/account/register" className="text-brand-navy underline">
          create an account
        </Link>
        .
      </div>
      {children}
    </>
  )
}
