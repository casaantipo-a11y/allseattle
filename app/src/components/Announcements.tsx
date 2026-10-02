import Link from 'next/link'

import { getHeader } from '@/lib/queries'

// Strip of short labelled links under the banner (spec §3), from the Header
// global. New component, so Tailwind rather than prototype CSS; sizes and
// colours come from the brand tokens in tailwind.css.
export async function Announcements() {
  const header = await getHeader()
  const items = header.announcements ?? []
  if (!items.length) return null

  return (
    <div className="container">
      {/* Gap via padding on a wrapper: the prototype's base.css zeroes list
          margins unlayered, which beats a Tailwind margin utility on the <ul>. */}
      <div className="pt-5">
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-2" aria-label="Announcements">
          {items.map((a) => (
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
      </div>
    </div>
  )
}
