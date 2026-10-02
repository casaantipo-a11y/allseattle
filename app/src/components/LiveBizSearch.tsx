'use client'

import { useState, type ReactNode } from 'react'

// Search over the business list that filters as you type (client's request,
// 02.10.2026): no Enter, no reload. The server renders every business of the
// current section/category once as `items` (row + the text to match); while
// the field is empty the normal paginated list (`children`) shows. The query
// is mirrored into ?q= so a reload or a shared link keeps it, and the form
// still works as a plain GET without JavaScript.

export type LiveItem = { id: number; text: string; node: ReactNode }

export function LiveBizSearch({
  action,
  initialQuery,
  label,
  icon,
  items,
  children,
}: {
  action: string
  initialQuery: string
  label: string
  icon: ReactNode
  items: LiveItem[]
  children: ReactNode
}) {
  const [query, setQuery] = useState(initialQuery)
  const needle = query.trim().toLowerCase()
  const shown = needle ? items.filter((i) => i.text.includes(needle)) : null

  const update = (value: string) => {
    setQuery(value)
    const url = new URL(window.location.href)
    if (value.trim()) url.searchParams.set('q', value)
    else url.searchParams.delete('q')
    url.searchParams.delete('page')
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <form
        className="dir-search"
        role="search"
        action={action}
        method="get"
        onSubmit={(e) => e.preventDefault()}
      >
        <span className="dir-search-icon">{icon}</span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => update(e.target.value)}
          placeholder="I am looking for..."
          aria-label={label}
          autoComplete="off"
        />
      </form>
      {shown ? (
        <div aria-live="polite">
          {shown.length ? (
            <div className="biz-list">{shown.map((i) => i.node)}</div>
          ) : (
            <p className="muted">No businesses match &ldquo;{query.trim()}&rdquo;.</p>
          )}
        </div>
      ) : (
        children
      )}
    </>
  )
}
