'use client'

import { useId, useState, type ReactNode } from 'react'

// Accessible tabs (roles, arrow keys). All panels are rendered on the server
// and only hidden, so their content is in the HTML for search engines.
export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const base = useId()
  if (tabs.length === 1) return <>{tabs[0].content}</>

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    setActive(next.id)
    document.getElementById(`${base}-tab-${next.id}`)?.focus()
  }

  return (
    <div>
      <div role="tablist" className="mb-5 flex gap-6 border-b-2 border-brand-line">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-0.5 min-h-11 cursor-pointer border-0 border-b-[3px] border-solid bg-transparent px-0 font-display text-base font-bold ${
              active === t.id ? 'border-[var(--color-accent)] text-brand-navy' : 'border-transparent text-brand-slate hover:text-brand-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== t.id}
        >
          {t.content}
        </div>
      ))}
    </div>
  )
}
