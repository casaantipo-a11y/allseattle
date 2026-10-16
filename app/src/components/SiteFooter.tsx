import Link from 'next/link'

import { getFooter, getHeader, getSiteSettings } from '@/lib/queries'

import { ExploreToggle } from './ExploreToggle'
import { Logo } from './Logo'
import { SOCIAL_ICONS, Svg } from './icons'

const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, '')}`

// The prototype's footer (css: footer.css) on real settings: contacts and
// socials from Site settings — an empty social shows "Coming soon" (spec §4) —
// and link columns from the Footer global. The first column is the "Explore"
// list that folds under a button on phones.
export async function SiteFooter() {
  const [settings, footer, header] = await Promise.all([getSiteSettings(), getFooter(), getHeader()])
  const year = new Date().getFullYear()
  const socials = [
    { key: 'facebook' as const, name: 'Facebook', url: settings.socials?.facebook },
    { key: 'instagram' as const, name: 'Instagram', url: settings.socials?.instagram },
  ]
  const [explore, ...rest] = footer.columns ?? []
  // Explore splits in two (client, 04.10.2026): the site's sections — whatever the
  // header menu links to — as an even grid, and everything else (About, Advertise,
  // Contact, Privacy, Terms) as a quiet bar at the bottom of the footer.
  // Advertising joined the header's top row (12.10.2026) but stays in the footer's
  // bottom bar with About / Contact — the Explore grid keeps the nine sections.
  const menuUrls = new Set((header.menu ?? []).map((m) => m.url).filter((u) => u !== '/advertise'))
  const exploreLinks = explore?.links ?? []
  const sectionLinks = exploreLinks.filter((l) => menuUrls.has(l.url))
  const metaLinks = exploreLinks.filter((l) => !menuUrls.has(l.url))

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-col footer-brand">
          <Logo href="/" variant="dark" />
          <div className="footer-copy">
            <div className="footer-copy-stack">
              <p>
                &copy; {year} {footer.copyright || 'AllSeattle. All rights reserved.'}
              </p>
              {/* Developer credit under the copyright, as before, but a small quiet link instead
                  of the WhatsApp pill (client, 16.10.2026). Lives in code, not in the Footer
                  global — it is not the owner's content. */}
              <a href="https://wa.me/380958191272" target="_blank" rel="noopener" className="footer-credit">
                Developed by Alexander
              </a>
            </div>
          </div>
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
                  <span className="footer-social-soon" title={`${s.name}: coming soon`}>
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
              {sectionLinks.map((l) => (
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
      {/* About, Advertise, Contact, Privacy, Terms: a bar across the whole footer under a
          full-width hairline, the links spread evenly from the content's left edge to its
          right (client, 07.10.2026). */}
      {metaLinks.length ? (
        <div className="footer-meta-bar">
          <ul className="container footer-meta">
            {metaLinks.map((l) => (
              <li key={l.url}>
                <Link href={l.url}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </footer>
  )
}
