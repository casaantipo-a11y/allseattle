'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Header } from '@/payload-types'

type Item = NonNullable<Header['announcements']>[number]

// The announcement links themselves. Client-side only for the path: Home
// already has its own contest strip under the top banner, so a contest
// announcement there would say the same thing twice (client's request).
export function AnnouncementList({ items }: { items: Item[] }) {
  const pathname = usePathname()
  const shown = pathname === '/' ? items.filter((a) => !a.url.startsWith('/contests')) : items
  if (!shown.length) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Announcements">
      {shown.map((a) => (
        <li key={`${a.label}-${a.url}`}>
          <Link
            href={a.url}
            className={`group inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm no-underline hover:underline ${
              a.highlight
                ? 'border-brand-red bg-brand-red/5 text-brand-navy'
                : 'border-brand-line bg-white text-brand-navy'
            }`}
          >
            <span
              className={`font-display rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                a.highlight ? 'bg-brand-red text-white' : 'bg-brand-navy text-white'
              }`}
            >
              {a.label}
            </span>
            <span className="font-semibold">{a.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
