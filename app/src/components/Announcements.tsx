import Link from 'next/link'

import { getHeader } from '@/lib/queries'

// A text that opens with a question ("Saw something newsworthy? Share the news") keeps
// only the call to action on phones: the question is hidden below 640px, where it
// wrapped the plate to two lines (client, 06.10.2026). Any other text is shown as is.
// The rule is .announcement-lead in components.css: Tailwind's `hidden` loses to the
// prototype's `.hidden { display: none !important }`.
function AnnouncementText({ text }: { text: string }) {
  const q = text.indexOf('? ')
  if (q < 0) return <span className="font-semibold">{text}</span>
  return (
    <span className="font-semibold">
      <span className="announcement-lead">{text.slice(0, q + 2)}</span>
      {text.slice(q + 2)}
    </span>
  )
}

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
              {/* "highlight" in the admin draws the plate with the red outline and tint
                  (spec §3: the contest plate is highlighted in the accent colour). Removed
                  on 04.10.2026 and brought back on 06.10.2026 at the client's request. */}
              <Link
                href={a.url}
                className={`group inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm text-brand-navy no-underline hover:underline ${
                  a.highlight ? 'border-brand-red bg-brand-red/5' : 'border-brand-line bg-white'
                }`}
              >
                <span
                  className="font-display rounded bg-brand-navy px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                >
                  {a.label}
                </span>
                <AnnouncementText text={a.text} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
