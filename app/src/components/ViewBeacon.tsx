'use client'

import { useEffect } from 'react'

// Counts one view of a car or job page per browser session (stage 3: the author
// sees it in the account). The pages are cached, so the count happens here.
export function ViewBeacon({ kind, id }: { kind: 'car' | 'job'; id: number }) {
  useEffect(() => {
    const key = `viewed:${kind}:${id}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // storage blocked: count anyway
    }
    const body = JSON.stringify({ kind, id })
    if (!navigator.sendBeacon?.('/api/views', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/views', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
    }
  }, [kind, id])
  return null
}
