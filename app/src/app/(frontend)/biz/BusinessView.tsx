import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { BizGallery } from '@/components/BizGallery'
import { MapClient } from '@/components/map/MapClient'
import { badgeFor, bizUrl, type BusinessFull, effectivePackage, telHref, viewFor } from '@/lib/business'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { salaryText, EMPLOYMENT_LABEL } from '@/lib/jobs'
import { getActivePromotions, getAllBusinesses, getProducts } from '@/lib/queries'
import { getJobs } from '@/lib/queries-phase3'
import { absoluteUrl } from '@/lib/site'
import type { Document, Media, Product } from '@/payload-types'

// The business page, laid out after the client's example (Commercial.pdf p. 3, the
// "Lux" listing, 15.10.2026): name with the month's views, a data table with icons,
// a wide map, promotions, a photo gallery with thumbnails, "About", products, jobs,
// files and related categories; on the right the logo card with the website button,
// similar places, contacts and socials. Package differences (spec §5):
//   standard — no products; an "Is this your business?" card
//   luxury   — products, jobs, the badge
//   premium  — branded: full-width header image, the brand colour on every accent,
//              no third-party ad slots on the page
// An expired package shows the standard design (effectivePackage()).

/* eslint-disable @next/next/no-img-element -- Payload serves sized WebP renditions */

const isObj = <T,>(v: T | number | null | undefined): v is T => typeof v === 'object' && v !== null
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const hostOf = (url: string) => {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
const withProto = (url: string) => (url.startsWith('http') ? url : `https://${url}`)

function Products({ items }: { items: Product[] }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-lg border border-brand-line bg-white">
          {isObj<Media>(p.image) ? <img src={mediaUrl(p.image, 'card') ?? ''} alt={p.image.alt || p.name} className="block aspect-square w-full object-cover" loading="lazy" /> : null}
          <div className="p-4">
            <div className="font-display text-base font-bold text-brand-navy">{p.name}</div>
            <div className="mb-1 mt-1 font-bold text-[var(--color-accent)]">{p.price != null ? money(p.price) : 'Ask for price'}</div>
            {p.description ? <div className="text-sm text-brand-slate">{p.description}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Files({ docs, title }: { docs: Document[]; title: string }) {
  if (!docs.length) return null
  return (
    <div>
      <div className="mb-2 font-semibold text-brand-navy">{title}</div>
      <ul className="m-0 list-none p-0">
        {docs.map((d) => (
          <li key={d.id} className="mb-1">
            <a href={d.url ?? '#'} target="_blank" rel="noopener" className="text-brand-navy underline hover:text-[var(--color-accent)]">
              {d.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}


const ICON = {
  address: ['M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z', 'M12 12.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  email: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  hours: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  website: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
  categories: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
} as const

function Icon({ name }: { name: keyof typeof ICON }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function InfoRow({ icon, label, children }: { icon: keyof typeof ICON; label: string; children: ReactNode }) {
  return (
    <div className="biz-info-row">
      <span className="biz-info-icon">
        <Icon name={icon} />
      </span>
      <span className="biz-info-label">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="biz-section scroll-mt-40" aria-label={title}>
      <h2 className="biz-section-title">{title}</h2>
      {children}
    </section>
  )
}

function Widget({ title, children, center = false }: { title?: string; children: ReactNode; center?: boolean }) {
  return (
    <div className="widget" style={{ marginBottom: 0 }}>
      {title ? <div className="widget-head">{title}</div> : null}
      <div className={`widget-body grid gap-3 ${center ? 'text-center' : ''}`}>{children}</div>
    </div>
  )
}

const catHref = (c: { section?: string | null; slug?: string | null }) =>
  `/${c.section === 'directory' || !c.section ? 'directory' : c.section}/${c.slug}`

/** A free listing's page: the name and the phone only, no logo, photos, description or
 *  links of the business (client, 24.10.2026). Kept out of search engines (page.tsx). */
function FreeBusinessView({ biz }: { biz: BusinessFull }) {
  return (
    <main id="content" data-page="business">
      <section className="section">
        <div className="container">
          <AdSlot code="BUSINESS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <nav aria-label="Breadcrumb" className="mt-4 mb-3 text-sm text-brand-slate">
            <Link href="/directory" className="text-brand-slate hover:text-brand-red">
              Directory
            </Link>
          </nav>
          <div className="grid max-w-[640px] gap-4">
            <h1 className="m-0">{biz.name}</h1>
            {biz.phone ? (
              <a href={telHref(biz.phone)} className="btn self-start justify-self-start">
                Call {biz.phone}
              </a>
            ) : null}
            <Widget title="Is this your business?">
              <div className="muted">Add your logo, photos, a description and your website with a package.</div>
              <Link href="/advertise" className="btn btn-sm btn-block">
                See packages
              </Link>
            </Widget>
          </div>
        </div>
      </section>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: biz.name,
          url: absoluteUrl(bizUrl(biz)),
          ...(biz.phone ? { telephone: biz.phone } : {}),
        }}
      />
    </main>
  )
}

export async function BusinessView({ biz }: { biz: BusinessFull }) {
  const pkg = effectivePackage(biz)
  if (!pkg) return <FreeBusinessView biz={biz} />
  const view = viewFor(pkg)
  const badge = badgeFor(pkg)
  const [promotions, products, allJobs, all] = await Promise.all([
    getActivePromotions(biz.id),
    pkg && pkg.maxProducts > 0 ? getProducts(biz.id) : Promise.resolve([] as Product[]),
    getJobs(),
    getAllBusinesses(),
  ])
  const jobs = allJobs.filter((j) => (typeof j.business === 'object' ? j.business?.id : j.business) === biz.id)

  const photos = (biz.gallery ?? []).filter(isObj<Media>)
  const priceLists = (biz.priceLists ?? []).filter(isObj<Document>)
  const certificates = (biz.certificates ?? []).filter(isObj<Document>)
  const categories = (biz.categories ?? []).filter((c) => typeof c === 'object')
  const logo = mediaUrl(biz.logo, 'card')
  const headerImage = view === 'premium' ? mediaUrl(biz.branding?.headerImage ?? null, 'hero') : null
  const brand = view === 'premium' && biz.branding?.brandColor ? biz.branding.brandColor : null
  const hasMap = biz.lat != null && biz.lng != null && (pkg ? pkg.mapPlacement : true)
  const path = bizUrl(biz)
  const socials = Object.entries(biz.socials ?? {}).filter(([k, v]) => k !== 'id' && typeof v === 'string' && v) as [string, string][]

  // Similar places: other businesses sharing one of its categories, paid packages first.
  const catIds = new Set(categories.map((c) => c.id))
  const similar = all
    .filter((b) => b.id !== biz.id && (b.categories ?? []).some((c) => catIds.has(c.id)))
    .sort((a, b) => (effectivePackage(b)?.order ?? 0) - (effectivePackage(a)?.order ?? 0) || (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, 3)

  const views = String(Math.max(0, biz.viewsCount ?? 0)).padStart(4, '0')

  const titleBlock = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {badge && view !== 'standard' ? <span className={`badge ${badge.cls}`}>{badge.label}</span> : null}
          {categories.map((c, i) => (
            <Link key={c.id} href={catHref(c)} className="text-sm font-semibold text-[var(--color-accent)]">
              {c.name}
              {i < categories.length - 1 ? ' ·' : ''}
            </Link>
          ))}
        </div>
        <h1 className="m-0">{biz.name}</h1>
      </div>
      {biz.viewsCount ? (
        <div className="flex items-center gap-3">
          <div className="biz-views" role="img" aria-label={`${biz.viewsCount} views this month`}>
            {views.split('').map((d, i) => (
              <span key={i} className="biz-views-digit">
                {d}
              </span>
            ))}
          </div>
          <div className={`max-w-[90px] text-xs leading-tight ${headerImage ? 'text-white' : 'text-brand-slate'}`}>views this month</div>
        </div>
      ) : null}
    </div>
  )

  const showOnMap = hasMap ? (
    <a href="#biz-map" className="whitespace-nowrap text-[var(--color-accent)] underline">
      Show on map
    </a>
  ) : null

  return (
    <main id="content" data-page="business" style={brand ? ({ '--brand': brand } as CSSProperties) : undefined}>
      <section className="section">
        <div className="container">
          {view !== 'premium' ? <AdSlot code="BUSINESS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" /> : null}

          {/* 16px under the top banner — it sat right on it — and 16px less under the title
              block (mb-2, was mb-6), so the info below stays put (client, 17.10.2026). */}
          <nav aria-label="Breadcrumb" className={`${view !== 'premium' ? 'mt-4 ' : ''}mb-3 text-sm text-brand-slate`}>
            <Link href="/directory" className="text-brand-slate hover:text-brand-red">
              Directory
            </Link>
            {categories[0] ? (
              <>
                <span aria-hidden="true"> / </span>
                <Link href={catHref(categories[0])} className="text-brand-slate hover:text-brand-red">
                  {categories[0].name}
                </Link>
              </>
            ) : null}
          </nav>

          {headerImage ? (
            <div className="relative mb-6 overflow-hidden rounded-xl">
              <img
                src={headerImage}
                alt={mediaAlt(biz.branding?.headerImage ?? null, biz.name)}
                className="block h-[220px] w-full object-cover sm:h-[320px]"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,27,42,0.75)] via-[rgba(13,27,42,0.15)] to-transparent" />
              <div className="biz-hero-title absolute inset-x-0 bottom-0 p-4 sm:p-8">{titleBlock}</div>
            </div>
          ) : (
            <div className="mb-2">{titleBlock}</div>
          )}

          <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <div className="biz-info">
                {biz.address ? (
                  <InfoRow icon="address" label="Address">
                    {biz.address} {showOnMap}
                  </InfoRow>
                ) : null}
                {biz.phone ? (
                  <InfoRow icon="phone" label="Phone">
                    <a href={telHref(biz.phone)} className="text-brand-navy">
                      {biz.phone}
                    </a>
                  </InfoRow>
                ) : null}
                {biz.hours?.length ? (
                  <InfoRow icon="hours" label="Opening hours">
                    {biz.hours.map((h) => (
                      <div key={h.id ?? h.days}>
                        <span className="font-semibold">{h.days}:</span> {h.time}
                      </div>
                    ))}
                  </InfoRow>
                ) : null}
                {biz.website ? (
                  <InfoRow icon="website" label="Website">
                    <a href={withProto(biz.website)} rel="noopener" target="_blank" className="text-brand-navy underline">
                      {hostOf(biz.website)}
                    </a>
                  </InfoRow>
                ) : null}
                {biz.email ? (
                  <InfoRow icon="email" label="Email">
                    <a href={`mailto:${biz.email}`} className="text-brand-navy underline">
                      {biz.email}
                    </a>
                  </InfoRow>
                ) : null}
                {categories.length ? (
                  <InfoRow icon="categories" label="What we do">
                    {categories.map((c) => c.name).join(', ')}
                  </InfoRow>
                ) : null}
              </div>

              {hasMap ? (
                <Section id="biz-map" title="On the map">
                  <MapClient
                    height={320}
                    points={[{ id: String(biz.id), lat: biz.lat as number, lng: biz.lng as number, title: biz.name, subtitle: biz.address ?? undefined, kind: view }]}
                  />
                </Section>
              ) : null}

              {promotions.length ? (
                <Section title="Promotions & deals">
                  <div className="overflow-hidden rounded-lg border border-brand-line">
                    {promotions.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-4 p-3 ${i % 2 ? 'bg-[#f7f8fa]' : 'bg-white'} ${i ? 'border-t border-brand-line' : ''}`}>
                        {isObj<Media>(p.image) ? (
                          <img src={mediaUrl(p.image, 'thumb') ?? ''} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" loading="lazy" />
                        ) : (
                          <span className="grid h-14 w-20 shrink-0 place-items-center rounded-md bg-[var(--color-accent-tint)] text-xl font-bold text-[var(--color-accent)]" aria-hidden="true">
                            %
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[var(--color-accent)]">{p.title}</div>
                          {p.description ? <div className="text-sm text-brand-slate">{p.description}</div> : null}
                        </div>
                        <div className="shrink-0 text-right text-xs text-brand-slate">
                          Valid until
                          <br />
                          {fmtDate(p.validUntil)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {photos.length ? (
                <Section title="Photos">
                  <BizGallery photos={photos.map((m) => ({ id: m.id, large: mediaUrl(m, 'hero') ?? '', thumb: mediaUrl(m, 'thumb') ?? '', alt: m.alt }))} />
                </Section>
              ) : null}

              {biz.description || biz.summary ? (
                <Section title={`About ${biz.name}`}>
                  {biz.description ? <RichText data={biz.description} /> : <div className="text-lg">{biz.summary}</div>}
                </Section>
              ) : null}

              {products.length ? (
                <Section title={`Products (${products.length})`}>
                  <Products items={products} />
                </Section>
              ) : null}

              {priceLists.length || certificates.length ? (
                <Section title="Downloads">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Files docs={priceLists} title="Price lists" />
                    <Files docs={certificates} title="Certificates" />
                  </div>
                </Section>
              ) : null}

              {categories.length ? (
                <Section title="Related categories">
                  <div className="rounded-lg bg-[#f7f8fa] px-4 py-3 text-sm">
                    {categories.map((c, i) => (
                      <span key={c.id}>
                        {i ? <span aria-hidden="true"> / </span> : null}
                        <Link href={catHref(c)} className="text-brand-navy underline">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                </Section>
              ) : null}
            </div>

            <aside className="grid gap-[var(--grid-gap)]">
              <Widget center>
                {logo ? (
                  <img src={logo} alt={`${biz.name} logo`} className="mx-auto block max-h-[140px] w-full object-contain" />
                ) : (
                  <div className="font-display text-2xl font-bold text-brand-navy">{biz.name}</div>
                )}
                {biz.website ? (
                  <a href={withProto(biz.website)} rel="noopener" target="_blank" className="btn btn-block">
                    Visit website
                  </a>
                ) : null}
                {biz.phone ? (
                  <a href={telHref(biz.phone)} className={`btn btn-block${biz.website ? ' btn-outline' : ''}`}>
                    Call {biz.phone}
                  </a>
                ) : null}
              </Widget>

              {view !== 'premium' ? <AdSlot code="BUSINESS_SIDEBAR_1" size="300x250" mobileSize="320x100" /> : null}

              {similar.length ? (
                <Widget title="Similar places">
                  {similar.map((b) => {
                    const img = mediaUrl(b.cover ?? b.logo, 'thumb')
                    const cat = (b.categories ?? [])[0]
                    return (
                      <Link key={b.id} href={bizUrl(b)} className="flex items-center gap-3 no-underline">
                        {img ? (
                          <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" loading="lazy" />
                        ) : (
                          <span className="h-12 w-12 shrink-0 rounded-md bg-[#f7f8fa]" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          <span className="block font-semibold text-brand-navy underline">{b.name}</span>
                          {cat ? <span className="block text-xs text-brand-slate">{cat.name}</span> : null}
                        </span>
                      </Link>
                    )
                  })}
                </Widget>
              ) : null}

              {jobs.length ? (
                <Widget title="We’re hiring">
                  {jobs.map((j) => (
                    <div key={j.id}>
                      <Link href={`/jobs/${j.slug}`} className="font-semibold text-brand-navy underline">
                        {j.title}
                      </Link>
                      <div className="text-xs text-brand-slate">{[salaryText(j), EMPLOYMENT_LABEL[j.employmentType]].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </Widget>
              ) : null}

              {biz.address || socials.length ? (
                <Widget title="Contacts">
                  {biz.address ? (
                    <div className="flex gap-2 text-sm [overflow-wrap:anywhere]">
                      <span className="text-brand-slate">
                        <Icon name="address" />
                      </span>
                      <span>
                        {biz.address}
                        {hasMap ? <span className="block">{showOnMap}</span> : null}
                      </span>
                    </div>
                  ) : null}
                  {socials.map(([k, v]) => (
                    <a key={k} href={withProto(v)} rel="noopener" target="_blank" className="text-sm text-brand-navy underline [overflow-wrap:anywhere]">
                      {k === 'x' ? 'X' : k.charAt(0).toUpperCase() + k.slice(1)}
                    </a>
                  ))}
                </Widget>
              ) : null}

              {view === 'standard' ? (
                <Widget title="Is this your business?">
                  <div className="muted">Add photos, products and a branded page with a Luxury or Premium package.</div>
                  <Link href="/advertise" className="btn btn-sm btn-block">
                    See packages
                  </Link>
                </Widget>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: biz.name,
          url: absoluteUrl(path),
          ...(biz.summary ? { description: biz.summary } : {}),
          ...(mediaUrl(biz.cover ?? biz.logo, 'card') ? { image: absoluteUrl(mediaUrl(biz.cover ?? biz.logo, 'card') as string) } : {}),
          ...(logo ? { logo: absoluteUrl(logo) } : {}),
          ...(biz.phone ? { telephone: biz.phone } : {}),
          ...(biz.email ? { email: biz.email } : {}),
          ...(biz.address
            ? {
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: biz.address,
                  addressLocality: 'Seattle',
                  addressRegion: 'WA',
                  addressCountry: 'US',
                },
              }
            : {}),
          ...(biz.lat != null && biz.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: biz.lat, longitude: biz.lng } } : {}),
          ...(biz.hours?.length ? { openingHours: biz.hours.map((h) => `${h.days} ${h.time}`) } : {}),
          sameAs: socials.map(([, v]) => withProto(v)),
        }}
      />
    </main>
  )
}
