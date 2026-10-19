'use client'

import { useEffect, useRef, type ReactNode } from 'react'

// A "Category: … ▾" button that opens a panel with the page's own category list — on
// phones and tablets, where the side column with that list drops to the foot of the page
// (client, 19.10.2026: navigation belongs above the list, not under it). A native
// <details>, so it opens without JavaScript; the script closes it on an outside click,
// on Escape and after a link inside is chosen. Styles: components.css (.drop-*).
export function DropPanel({ label, current, children, className = '' }: { label: string; current: string; children: ReactNode; className?: string }) {
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

  return (
    <details ref={ref} className={`drop ${className}`}>
      <summary className="drop-button">
        <span className="drop-label">{label}:</span>
        <span className="drop-current">{current}</span>
        <svg className="drop-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      {/* A chosen link closes the panel (sub-category groups are <summary>, not links). */}
      <div
        className="drop-panel"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) ref.current?.removeAttribute('open')
        }}
      >
        {children}
      </div>
    </details>
  )
}
