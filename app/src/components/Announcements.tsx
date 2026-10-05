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
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2" aria-label="Announcements">
          {items.map((a) => (
            <li key={`${a.label}-${a.url}`}>
              {/* No red outline for highlighted items any more (client, 04.10.2026): every
                  item is drawn the same; the admin's "highlight" flag currently has no
                  visual effect. */}
              <Link
                href={a.url}
                className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-navy no-underline hover:underline"
              >
                <span
                  className="font-display rounded bg-brand-navy px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
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
