import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AccountForm, LogoutButton } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'
import { getCustomer } from '@/lib/account'

export const metadata: Metadata = { title: 'Your account' }

// The account home (stage 3, step 1): profile for now; "My listings", "My
// business" and billing join it in the next steps.
export default async function AccountPage() {
  const me = await getCustomer()
  if (!me) redirect('/account/login')
  return (
    <AccountShell eyebrow="Your account" title={`Hello, ${me.name}`} intro={<span>Signed in as {me.email}</span>}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="m-0 text-xl">Profile</h2>
        <LogoutButton />
      </div>
      <AccountForm mode="profile" customerId={me.id} values={{ name: me.name ?? '', phone: me.phone ?? '' }} />
    </AccountShell>
  )
}
