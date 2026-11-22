'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function send(payload: object) {
  const body = JSON.stringify(payload)
  if (!navigator.sendBeacon?.('/api/views', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/views', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
  }
}

// Counts one view of a car, job or business page per browser session (the owner sees it
// in the account, the pages show it from 10 views). The pages are cached, so the count
// happens here.
export function ViewBeacon({ kind, id }: { kind: 'car' | 'job' | 'business'; id: number }) {
  useEffect(() => {
    const key = `viewed:${kind}:${id}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // storage blocked: count anyway
    }
    send({ kind, id })
  }, [kind, id])
  return null
}

// Pages that are not counted as site views: the admin and the owner's account, the
// payment-link page. (/api never renders a page.)
const NOT_COUNTED = ['/admin', '/account', '/pay', '/api']

/** One page view of the site per page shown — also after a client-side navigation, which
 *  is not a page load but is a page the visitor read. Mounted once in the layout. */
export function SiteViewBeacon() {
  const path = usePathname()
  useEffect(() => {
    if (NOT_COUNTED.some((p) => path === p || path.startsWith(`${p}/`))) return
    send({ kind: 'site' })
  }, [path])
  return null
}
