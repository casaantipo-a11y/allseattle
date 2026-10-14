import type { Metadata } from 'next'

// Account pages are personal: never indexed, always rendered per request (they
// read the auth cookie).
export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
