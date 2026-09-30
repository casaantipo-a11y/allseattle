'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useSyncExternalStore } from 'react'

// Cookie banner + GA4 with Consent Mode v2 (spec §9). Nothing from Google
// loads until the visitor accepts: before that there is no gtag script on the
// page at all. On accept, consent defaults are declared as granted and GA4 is
// loaded; on decline the choice is remembered and GA4 never loads.
// The choice lives in localStorage — it is the visitor's own preference and
// never needs to reach the server.

const KEY = 'allseattle-consent'
const EVENT = 'allseattle-consent-change'
type Choice = 'granted' | 'denied'

// The stored choice as an external store: read straight from localStorage in
// the browser, "unknown" on the server so the banner never flashes into the
// server-rendered HTML.
function read(): Choice | null {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}
const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT, cb)
  }
}

export function CookieConsent({ gaId }: { gaId?: string | null }) {
  const choice = useSyncExternalStore<Choice | null | 'unknown'>(subscribe, read, () => 'unknown')

  const decide = (c: Choice) => {
    try {
      window.localStorage.setItem(KEY, c)
    } catch {
      // private mode: the banner will simply ask again next time
    }
    window.dispatchEvent(new Event(EVENT))
  }

  return (
    <>
      {choice === 'granted' && gaId ? (
        <>
          <Script id="ga-consent" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
        </>
      ) : null}

      {choice === null ? (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-line bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(13,27,42,0.12)]"
        >
          <div className="mx-auto flex max-w-[1376px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm text-brand-slate">
              We use cookies to understand how the site is used. Analytics load only if you accept.{' '}
              <Link href="/privacy" className="text-brand-navy underline">
                Privacy Policy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => decide('denied')}>
                Decline
              </button>
              <button type="button" className="btn btn-sm" onClick={() => decide('granted')}>
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
