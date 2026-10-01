'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { Svg, UI_ICONS } from './icons'

// The banner search box (spec §6): suggestions after 2 characters, 250 ms
// debounce, arrow keys + Enter, Escape to close; submitting goes to /search.
// Same markup and classes as the prototype's .search-stub.

type Hit = { id: number; title: string; url: string; kind: string }
const KIND: Record<string, string> = { news: 'News', businesses: 'Business', 'car-listings': 'Car', jobs: 'Job', events: 'Event' }

export function SearchBox() {
  const router = useRouter()
  const listId = useId()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return
    const ctrl = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        const data = (await res.json()) as { hits: Hit[] }
        setHits(data.hits)
        setActive(-1)
        setOpen(true)
      } catch {
        // aborted or offline: keep the previous list
      }
    }, 250)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const shown = q.trim().length >= 2 && open ? hits : []

  return (
    <form
      ref={box}
      className="search-stub"
      role="search"
      action="/search"
      method="get"
      onSubmit={(e) => {
        if (active >= 0 && shown[active]) {
          e.preventDefault()
          setOpen(false)
          router.push(shown[active].url)
        }
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, shown.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, -1))
          } else if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search AllSeattle..."
        aria-label="Search"
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        minLength={2}
      />
      <button type="submit" aria-label="Search">
        <Svg html={UI_ICONS.search} />
      </button>
      {shown.length ? (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-30 m-0 list-none overflow-hidden rounded-lg border border-brand-line bg-white p-0 text-left shadow-[0_8px_24px_rgba(13,27,42,0.18)]">
          {shown.map((h, i) => (
            <li
              key={h.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm ${i === active ? 'bg-[#f7f8fa]' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                setOpen(false)
                router.push(h.url)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="font-semibold text-brand-navy">{h.title}</span>
              <span className="shrink-0 text-xs text-brand-slate">{KIND[h.kind] ?? ''}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
