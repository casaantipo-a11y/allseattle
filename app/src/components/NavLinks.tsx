'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_ICONS, Svg } from './icons'

export type NavItem = {
  label: string
  url: string
  row: 'primary' | 'secondary'
  icon?: string | null
  /** Sub-sections shown after the item as "A / B" (e.g. Cars: Services / For sale). */
  subLinks?: { label: string; url: string }[]
}

// Client component only for the active-link highlight; the list itself comes
// from the Header global and is rendered on the server.
function isActive(pathname: string, url: string) {
  if (url === '/') return pathname === '/'
  return pathname === url || pathname.startsWith(`${url}/`)
}

/** A sub-link is active on its own URL and below it; the one that is also
 * the parent's URL (Cars → For sale = /cars) only when no sibling matches
 * more specifically — /cars/services is "Services", not "For sale". */
function isSubActive(pathname: string, url: string, siblings: { url: string }[]) {
  if (!isActive(pathname, url)) return false
  return !siblings.some((s) => s.url !== url && s.url.length > url.length && isActive(pathname, s.url))
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
              {item.subLinks?.length ? (
                <span className="nav-sub">
                  {item.subLinks.map((sub, i) => {
                    const subActive = isSubActive(pathname, sub.url, item.subLinks!)
                    return (
                      <span key={sub.url} className="nav-sub-item">
                        {i > 0 ? (
                          <span className="nav-sub-sep" aria-hidden="true">
                            /
                          </span>
                        ) : null}
                        <Link
                          href={sub.url}
                          className={subActive ? 'active' : undefined}
                          aria-current={subActive ? 'page' : undefined}
                        >
                          {sub.label}
                        </Link>
                      </span>
                    )
                  })}
                </span>
              ) : null}
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
