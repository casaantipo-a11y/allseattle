'use client'

import { useEffect, useRef } from 'react'

// Cloudflare Turnstile for the site's forms, rendered from code. The script's own
// one-time scan for `.cf-turnstile` misses a box that appears after a client-side
// page change, or when another page already loaded the script in explicit mode (the
// contest's Vote, sign-up) — the form then went out without an answer and failed
// with "anti-spam check failed" (17.10.2026). The answer is single-use and arrives a
// second or two after the widget loads, so forms wait for it and reset it after each
// attempt. Load the script with `TURNSTILE_SCRIPT`.

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type Turnstile = {
  render: (el: HTMLElement, opts: { sitekey: string; appearance?: 'always' | 'execute' | 'interaction-only' }) => string
  remove: (id: string) => void
  reset: (id?: string) => void
  getResponse: (id?: string) => string | undefined
}
const api = () => (window as unknown as { turnstile?: Turnstile }).turnstile

export function useTurnstile(siteKey: string | null | undefined, { enabled = true, appearance }: { enabled?: boolean; appearance?: 'always' | 'interaction-only' } = {}) {
  const box = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey || !enabled) return
    let id: string | null = null
    const timer = window.setInterval(() => {
      const ts = api()
      if (!ts || !box.current || id) return
      id = ts.render(box.current, { sitekey: siteKey, ...(appearance ? { appearance } : {}) })
      widgetId.current = id
      window.clearInterval(timer)
    }, 100)
    return () => {
      window.clearInterval(timer)
      try {
        if (id) api()?.remove(id)
      } catch {}
      widgetId.current = null
    }
  }, [siteKey, enabled, appearance])

  return {
    /** Where the widget goes: `<div ref={box} className="cf-turnstile" />`. */
    box,
    /** The answer, waiting up to `ms` for it; '' when there is none (or no key — the server then skips the check). */
    async answer(ms = 10000) {
      if (!siteKey) return ''
      for (let waited = 0; waited <= ms; waited += 200) {
        const a = (widgetId.current && api()?.getResponse(widgetId.current)) || ''
        if (a) return a
        await new Promise((r) => setTimeout(r, 200))
      }
      return ''
    },
    /** A fresh answer for the next attempt. Never throws (Turnstile does when there is no widget). */
    reset() {
      try {
        if (widgetId.current) api()?.reset(widgetId.current)
      } catch {}
    },
  }
}
