'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export type CategoryOption = { label: string; href: string; active: boolean }

// The events category filter (client, 18.10.2026): 20 categories didn't work as a cloud of
// chips, so one "Category: …" button opens a panel with all of them in columns. A native
// <details>, so it opens without JavaScript too; the script only closes it on an outside
// click, on Escape and after a choice. The options are plain links (?category=), as before.
export function EventCategoryMenu({ all, options, current }: { all: CategoryOption; options: CategoryOption[]; current: string }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const close = () => ref.current?.removeAttribute('open')
    const onClick = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ref.current?.open) {
        close()
        ref.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const item = (o: CategoryOption) => (
    <li key={o.href}>
      <Link
        href={o.href}
        className={o.active ? 'active' : undefined}
        aria-current={o.active ? 'page' : undefined}
        onClick={() => ref.current?.removeAttribute('open')}
      >
        {o.label}
      </Link>
    </li>
  )

  return (
    <details ref={ref} className="events-cat">
      <summary className="events-cat-button">
        <span className="events-cat-label">Category:</span>
        <span className="events-cat-current">{current}</span>
        <svg className="events-cat-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="events-cat-panel">
        <ul className="events-cat-all">{item(all)}</ul>
        <ul className="events-cat-list">{options.map(item)}</ul>
      </div>
    </details>
  )
}
