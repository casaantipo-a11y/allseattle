'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { businessSubdomainOf } from '@/lib/subdomain'

// On {business}.allseattle.org the root path IS the business page (src/proxy.ts rewrites it),
// so a link to "/" there — Home, the logo — leads to the page you are on, and the header
// would mark Home as the current page. Home means the main site's home.

const noopSubscribe = () => () => {}

/** True in the browser on a business subdomain; false on the server and on the main site.
 *  `root` is ROOT_DOMAIN when subdomains are enabled, undefined otherwise. */
export function useOnBusinessSubdomain(root: string | undefined): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => (root ? businessSubdomainOf(window.location.host, root) !== null : false),
    () => false,
  )
}

/** Sends clicks on links to "/" to the main domain. Renders nothing. */
export function SubdomainHome({ root }: { root: string | undefined }) {
  const onSubdomain = useOnBusinessSubdomain(root)

  useEffect(() => {
    if (!onSubdomain || !root) return
    // Capture phase on the document, ahead of React and next/link, which would "navigate"
    // to the address already shown.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest('a') : null
      const raw = a?.getAttribute('href')
      // In-page anchors (#biz-map, #content) also resolve to "/" here, but stay on the page.
      if (!a || !raw || raw.startsWith('#') || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href)
      if (url.origin !== window.location.origin || url.pathname !== '/') return
      e.preventDefault()
      e.stopPropagation()
      url.hostname = root // same scheme and port, the main domain
      window.location.href = url.href
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [onSubdomain, root])

  return null
}
