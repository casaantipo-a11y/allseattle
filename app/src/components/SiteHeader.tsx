import Link from 'next/link'

import { getHeader } from '@/lib/queries'

import { Logo } from './Logo'
import { NavLinks, type NavItem } from './NavLinks'
import { Svg, UI_ICONS } from './icons'

// The prototype's header, same classes and structure (css: header.css): logo,
// two rows of menu centred between the logo and the utilities, sticky on
// scroll. The menu itself is the `Header` global, editable in the admin.
export async function SiteHeader() {
  const header = await getHeader()
  const items: NavItem[] = (header.menu ?? []).map((m) => ({
    label: m.label,
    url: m.url,
    row: m.row,
    icon: m.icon,
    subLinks: (m.subLinks ?? []).map((l) => ({ label: l.label, url: l.url })),
  }))

  return (
    <header className="site-header" id="site-header-functional">
      <div className="container header-top">
        <Logo href="/" />
        <NavLinks items={items} />
        <div className="header-utils">
          <span className="lang-switch" title="English" aria-label="Language: English">
            ENG
          </span>
          <Link href="/add-business" className="nav-stub nav-stub--accent">
            Add your business
          </Link>
          <Link href="/admin" className="account-btn" aria-label="Log in" prefetch={false}>
            <Svg html={UI_ICONS.account} />
          </Link>
        </div>
      </div>
    </header>
  )
}
