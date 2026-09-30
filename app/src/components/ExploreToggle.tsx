'use client'

import { useState, type ReactNode } from 'react'

// On phones the Explore list is folded under a button (footer.css); from 640px
// the button is hidden and the list is always open, so the state only matters
// on small screens.
export function ExploreToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="footer-explore-toggle"
        aria-expanded={open}
        aria-controls="footer-explore-list"
        onClick={() => setOpen((v) => !v)}
      >
        Explore all sections
      </button>
      <ul id="footer-explore-list" className={open ? 'is-open' : undefined}>
        {children}
      </ul>
    </>
  )
}
