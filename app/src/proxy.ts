import { NextResponse, type NextRequest } from 'next/server'

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

const RESERVED = new Set(['www', 'admin', 'api', 'app', 'mail'])

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
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0]
  if (host === root || !host.endsWith(`.${root}`)) return null
  const sub = host.slice(0, -(root.length + 1))
  if (!sub || sub.includes('.') || RESERVED.has(sub)) return null
  return { sub, root }
}

export function proxy(req: NextRequest) {
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
