import type { Metadata, Viewport } from 'next'
import { Libre_Franklin, Public_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { Announcements } from '@/components/Announcements'
import { CookieConsent } from '@/components/CookieConsent'
import { HeroBanner } from '@/components/HeroBanner'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getSiteSettings } from '@/lib/queries'
import { siteUrl } from '@/lib/site'

// Order matters: tokens first, then the prototype's CSS in its own order, then
// Tailwind (layered, so it never overrides the prototype).
import './styles/tokens.css'
import './styles/base.css'
import './styles/header.css'
import './styles/footer.css'
import './styles/components.css'
import './styles/home.css'
import './styles/news.css'
import './styles/directory.css'
import './styles/pricing.css'
import './styles/business.css'
import './tailwind.css'

// The prototype's faces (the user chose to keep them over the spec's
// Montserrat + Inter), self-hosted by next/font — no request to Google Fonts
// from the visitor's browser.
const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-libre-franklin',
  display: 'swap',
})
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-public-sans',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings.siteName || 'AllSeattle'
  const description = settings.description || undefined
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} — Seattle news, businesses, events and jobs`, template: `%s | ${name}` },
    description,
    applicationName: name,
    icons: { icon: '/brand/favicon.svg' },
    openGraph: { type: 'website', siteName: name, locale: 'en_US', description },
    twitter: { card: 'summary_large_image' },
    verification: settings.searchConsoleVerification
      ? { google: settings.searchConsoleVerification }
      : undefined,
  }
}

export const viewport: Viewport = { themeColor: '#0D1B2A' }

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <html lang="en" className={`${libreFranklin.variable} ${publicSans.variable}`}>
      <body>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">
          Skip to content
        </a>
        <SiteHeader />
        <HeroBanner />
        <Announcements />
        {children}
        <SiteFooter />
        <CookieConsent gaId={settings.ga4MeasurementId} />
      </body>
    </html>
  )
}
