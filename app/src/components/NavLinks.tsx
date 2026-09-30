'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_ICONS, Svg } from './icons'

export type NavItem = { label: string; url: string; row: 'primary' | 'secondary'; icon?: string | null }

// Client component only for the active-link highlight; the list itself comes
// from the Header global and is rendered on the server.
function isActive(pathname: string, url: string) {
  if (url === '/') return pathname === '/'
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || '/'
  const primary = items.filter((i) => i.row === 'primary')
  const secondary = items.filter((i) => i.row === 'secondary')
  return (
    <nav className="nav-stack" aria-label="Main">
      <ul className="nav-links">
        {primary.map((item) => {
          const active = isActive(pathname, item.url)
          return (
            <li key={item.url}>
              <Link href={item.url} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
                {item.icon && item.icon !== 'none' && NAV_ICONS[item.icon] ? (
                  <Svg className="nav-icon" html={NAV_ICONS[item.icon]} />
                ) : null}
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
      {secondary.length > 0 && (
        <ul className="nav-secondary">
          {secondary.map((item) => {
            const active = isActive(pathname, item.url)
            return (
              <li key={item.url}>
                <Link href={item.url} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
