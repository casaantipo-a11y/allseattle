'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Leaves out a piece of the shared chrome on the listed paths. The layout renders the
// photo banner and the announcement plates for every page; a form page like
// /add-business goes without them (client, 07.10.2026). Rendering nothing (rather than
// hiding with CSS) also keeps the banner photo from downloading on those pages.
// `sections` leaves it out on a path and everything under it ('/account' → /account/login, …).
export function HiddenOn({ paths, sections = [], children }: { paths: string[]; sections?: string[]; children: ReactNode }) {
  const pathname = usePathname()
  const hidden = paths.includes(pathname) || sections.some((s) => pathname === s || pathname.startsWith(`${s}/`))
  return hidden ? null : children
}
