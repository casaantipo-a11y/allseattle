import type { Metadata } from 'next'

import { AccountForm } from '@/components/account/AccountForm'
import { AccountShell } from '@/components/account/AccountShell'

export const metadata: Metadata = { title: 'Reset your password' }

export default function ForgotPage() {
  return (
    <AccountShell middle title="Reset your password" intro="Enter the email you signed up with — we will send you a link to choose a new password.">
      <AccountForm mode="forgot" />
    </AccountShell>
  )
}
