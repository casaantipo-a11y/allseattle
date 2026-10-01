import Link from 'next/link'

import { getFooter, getSiteSettings } from '@/lib/queries'

import { ExploreToggle } from './ExploreToggle'
import { Logo } from './Logo'
import { SOCIAL_ICONS, Svg } from './icons'

const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, '')}`

// The prototype's footer (css: footer.css) on real settings: contacts and
// socials from Site settings — an empty social shows "Coming soon" (spec §4) —
// and link columns from the Footer global. The first column is the "Explore"
// list that folds under a button on phones.
export async function SiteFooter() {
  const [settings, footer] = await Promise.all([getSiteSettings(), getFooter()])
  const year = new Date().getFullYear()
  const socials = [
    { key: 'facebook' as const, name: 'Facebook', url: settings.socials?.facebook },
    { key: 'instagram' as const, name: 'Instagram', url: settings.socials?.instagram },
  ]
  const [explore, ...rest] = footer.columns ?? []

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-col footer-brand">
          <Logo href="/" variant="dark" />
          <p className="footer-copy">
            &copy; {year} {footer.copyright || 'AllSeattle. All rights reserved.'}
          </p>
        </div>

        <div className="footer-col footer-contact">
          <h4>Contact</h4>
          <ul>
            {settings.phone ? (
              <li>
                Phone: <a href={telHref(settings.phone)}>{settings.phone}</a>
              </li>
            ) : null}
            <li>
              Email: {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : 'Coming soon'}
            </li>
            {settings.address ? <li>{settings.address}</li> : null}
          </ul>
        </div>

        <div className="footer-col footer-follow">
          <h4>Follow us</h4>
          <ul className="footer-social">
            {socials.map((s) =>
              s.url ? (
                <li key={s.key}>
                  <a href={s.url} rel="noopener me" target="_blank" aria-label={s.name}>
                    <Svg html={SOCIAL_ICONS[s.key]} />
                    <span className="footer-social-label">{s.name}</span>
                  </a>
                </li>
              ) : (
                <li key={s.key}>
                  <span title={`${s.name}: coming soon`}>
                    <Svg html={SOCIAL_ICONS[s.key]} />
                    <span className="footer-social-label">{s.name}: coming soon</span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>

        {explore ? (
          <div className="footer-col footer-col--wide footer-explore">
            <h4>{explore.title}</h4>
            <ExploreToggle>
              {(explore.links ?? []).map((l) => (
                <li key={l.url}>
                  <Link href={l.url}>{l.label}</Link>
                </li>
              ))}
            </ExploreToggle>
          </div>
        ) : null}

        {rest.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {(col.links ?? []).map((l) => (
                <li key={l.url}>
                  <Link href={l.url}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}
