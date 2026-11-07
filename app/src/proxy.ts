import { NextResponse, type NextRequest } from 'next/server'

import { siteUrl } from '@/lib/site'
import { businessSubdomainOf } from '@/lib/subdomain'

// Business subdomains (spec §5): {subdomain}.{ROOT_DOMAIN}/ shows that
// business's page. Off unless ENABLE_SUBDOMAINS=true (on in production since
// 23.10.2026, with the wildcard DNS and certificate on Vercel).
// Only the root path is rewritten; assets, /_next and /api pass through, so
// the page's own CSS and scripts load from the subdomain as usual. Any other page
// asked on a subdomain (/news, /directory…) belongs to the main site, so it is
// redirected there and the address bar shows allseattle.org/news, not
// mvstar.allseattle.org/news (client, 24.10.2026). A client-side navigation fails
// on the cross-origin redirect and Next falls back to a full page load, which then
// lands on the main domain too.

// The admin opens in English for everyone (client, 19.10.2026: the login page came up
// in Russian). Payload takes the language from its `payload-lng` cookie, then from the
// browser's Accept-Language, then English — so the header is dropped on /admin and a
// Russian browser lands on English. Choosing Russian in the account settings sets the
// cookie, which still wins.
function adminInEnglish(req: NextRequest) {
  const headers = new Headers(req.headers)
  headers.delete('accept-language')
  return NextResponse.next({ request: { headers } })
}

/** The business subdomain of the request (`mvstar` in mvstar.allseattle.org), or null. */
function businessSubdomain(req: NextRequest): { sub: string; root: string } | null {
  if (process.env.ENABLE_SUBDOMAINS !== 'true') return null
  const root = process.env.ROOT_DOMAIN?.toLowerCase()
  if (!root) return null
  const sub = businessSubdomainOf(req.headers.get('host') || '', root)
  return sub ? { sub, root } : null
}

// The address the site had before allseattle.org was connected still answers with a full copy
// of it, and Google saw two identical sites. Its pages go to the real domain with a 308, the
// same path and query. Only the exact host: the build addresses (allseattle-xxxx-all-seattle
// .vercel.app) are left alone. The matcher below keeps /api, /_next and files out of the
// proxy, so the Stripe webhook and the crons — which Vercel and Stripe call and which do not
// follow a redirect — are not touched.
const LEGACY_HOSTS = new Set(['allseattle.vercel.app'])

function legacyHostRedirect(req: NextRequest): NextResponse | null {
  // A trailing dot (`allseattle.vercel.app.`) is the same host written as a full DNS name.
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0].replace(/\.$/, '')
  if (!LEGACY_HOSTS.has(host)) return null
  const target = new URL(siteUrl())
  if (target.hostname === host) return null // the site address is the old one: no loop
  // Set the parts one by one: `new URL('//evil.com', base)` would leave the site (an open redirect).
  const url = new URL(target.origin)
  url.pathname = req.nextUrl.pathname
  url.search = req.nextUrl.search
  url.searchParams.delete('_rsc')
  return NextResponse.redirect(url, 308)
}

export function proxy(req: NextRequest) {
  const legacy = legacyHostRedirect(req)
  if (legacy) return legacy
  const found = businessSubdomain(req)
  if (found) {
    if (req.nextUrl.pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = `/sub/${found.sub}`
      return NextResponse.rewrite(url)
    }
    const url = new URL(`${req.nextUrl.protocol}//${found.root}${req.nextUrl.pathname}${req.nextUrl.search}`)
    url.searchParams.delete('_rsc')
    return NextResponse.redirect(url, 308)
  }
  if (req.nextUrl.pathname.startsWith('/admin')) return adminInEnglish(req)
  return NextResponse.next()
}

// Every page path, since a subdomain page links anywhere on the site; not /_next, /api or
// files with an extension.
export const config = {
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
