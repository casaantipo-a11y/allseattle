import { NextResponse, type NextRequest } from 'next/server'

// Business subdomains (spec §5): {subdomain}.{ROOT_DOMAIN}/ shows that
// business's page. Off unless ENABLE_SUBDOMAINS=true — it needs the real
// domain and a wildcard DNS record, neither of which exists yet.
// Only the root path is rewritten; assets, /_next and /api pass through, so
// the page's own CSS and scripts load from the subdomain as usual.

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

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) return adminInEnglish(req)
  if (process.env.ENABLE_SUBDOMAINS !== 'true') return NextResponse.next()
  const root = process.env.ROOT_DOMAIN?.toLowerCase()
  if (!root) return NextResponse.next()

  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0]
  if (host === root || !host.endsWith(`.${root}`)) return NextResponse.next()
  const sub = host.slice(0, -(root.length + 1))
  if (!sub || sub.includes('.') || RESERVED.has(sub)) return NextResponse.next()

  if (req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = `/sub/${sub}`
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
}
