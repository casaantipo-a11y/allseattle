'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

// What Tab can reach: a control with tabindex="-1" (the forms' honeypot field) is skipped by the browser too.
const FOCUSABLE = ['a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', '[tabindex]']
  .map((s) => `${s}:not([disabled]):not([tabindex="-1"])`)
  .join(', ')

/**
 * While a dialog is open (QA 25.11.2026): focus goes into it — to the first field, unless the dialog
 * put it somewhere itself — Tab and Shift+Tab stay inside it, and when it closes the focus goes back
 * to the button that opened it. `box` is the element with role="dialog".
 */
export function useModalFocus(open: boolean, box: RefObject<HTMLElement | null>) {
  const opener = useRef<HTMLElement | null>(null)

  // A layout effect runs before the dialog's own effects move the focus, so this is still the trigger.
  useLayoutEffect(() => {
    if (!open) return
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => {
      if (opener.current?.isConnected) opener.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = box.current
    if (el && !el.contains(document.activeElement)) {
      const first = el.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), textarea, select')
      ;(first ?? el).focus()
    }
    const onKey = (e: KeyboardEvent) => {
      const dialog = box.current
      if (e.key !== 'Tab' || !dialog) return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null)
      if (!items.length) return e.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === dialog || !dialog.contains(at))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (at === last || !dialog.contains(at))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, box])
}
