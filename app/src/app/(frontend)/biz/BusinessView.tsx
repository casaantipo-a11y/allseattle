import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { Tabs } from '@/components/Tabs'
import { MapClient } from '@/components/map/MapClient'
import { badgeFor, bizPath, type BusinessFull, effectivePackage, telHref, viewFor } from '@/lib/business'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getActivePromotions, getProducts } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'
import type { Document, Media, Product, Promotion } from '@/payload-types'

// The business page, in the three designs of spec §5:
//   standard — contacts, description, map, photos, promotions, price lists
//   luxury   — plus tabs (Products, Promotions; Jobs arrives in phase 3), a big gallery, the badge
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

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="widget">
      <div className="widget-head">{title}</div>
      <div className="widget-body">{children}</div>
    </div>
  )
}

function Contacts({ biz }: { biz: BusinessFull }) {
  const socials = Object.entries(biz.socials ?? {}).filter(([k, v]) => k !== 'id' && typeof v === 'string' && v)
  return (
    <Card title="Contacts">
      <dl className="m-0 grid gap-3 text-sm [overflow-wrap:anywhere]">
        {biz.address ? (
          <div>
            <dt className="font-semibold text-brand-slate">Address</dt>
            <dd className="m-0">{biz.address}</dd>
          </div>
        ) : null}
        {biz.phone ? (
          <div>
            <dt className="font-semibold text-brand-slate">Phone</dt>
            <dd className="m-0">
              <a href={telHref(biz.phone)} className="text-brand-navy">
                {biz.phone}
              </a>
            </dd>
          </div>
        ) : null}
        {biz.email ? (
          <div>
            <dt className="font-semibold text-brand-slate">Email</dt>
            <dd className="m-0">
              <a href={`mailto:${biz.email}`} className="text-brand-navy">
                {biz.email}
              </a>
            </dd>
          </div>
        ) : null}
        {biz.website ? (
          <div>
            <dt className="font-semibold text-brand-slate">Website</dt>
            <dd className="m-0">
              <a href={withProto(biz.website)} rel="noopener" target="_blank" className="text-brand-navy">
                {hostOf(biz.website)}
              </a>
            </dd>
          </div>
        ) : null}
        {biz.hours?.length ? (
          <div>
            <dt className="font-semibold text-brand-slate">Hours</dt>
            <dd className="m-0">
              <table className="w-full border-collapse">
                <tbody>
                  {biz.hours.map((h) => (
                    <tr key={h.id ?? h.days}>
                      <td className="py-0.5 pr-3 align-top">{h.days}</td>
                      <td className="py-0.5 text-right whitespace-nowrap">{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </dd>
          </div>
        ) : null}
        {socials.length ? (
          <div>
            <dt className="font-semibold text-brand-slate">Follow</dt>
            <dd className="m-0 flex flex-wrap gap-3">
              {socials.map(([k, v]) => (
                <a key={k} href={withProto(v as string)} rel="noopener" target="_blank" className="capitalize text-brand-navy">
                  {k === 'x' ? 'X' : k}
                </a>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
      {biz.phone ? (
        <a href={telHref(biz.phone)} className="btn btn-block mt-4">
          Call {biz.phone}
        </a>
      ) : null}
    </Card>
  )
}

function Gallery({ photos, big }: { photos: Media[]; big: boolean }) {
  if (!photos.length) return null
  return (
    <div className={`grid gap-3 ${big ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {photos.map((m) => (
        <a key={m.id} href={mediaUrl(m, 'hero') ?? '#'} target="_blank" rel="noopener" className="block">
          <img
            src={mediaUrl(m, big ? 'card' : 'thumb') ?? ''}
            alt={m.alt}
            loading="lazy"
            className={`block w-full rounded-lg object-cover ${big ? 'aspect-[4/3]' : 'aspect-square'}`}
          />
        </a>
      ))}
    </div>
  )
}

function Promotions({ items }: { items: Promotion[] }) {
  if (!items.length) return <p className="muted">No current promotions.</p>
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
      {items.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-lg border-2 border-[var(--color-accent)] bg-white">
          {isObj<Media>(p.image) ? <img src={mediaUrl(p.image, 'card') ?? ''} alt="" className="block aspect-[16/9] w-full object-cover" loading="lazy" /> : null}
          <div className="p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">Until {fmtDate(p.validUntil)}</p>
            <p className="mb-1 mt-1 font-display text-lg font-bold text-brand-navy">{p.title}</p>
            {p.description ? <p className="m-0 text-sm text-brand-slate">{p.description}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Products({ items }: { items: Product[] }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-lg border border-brand-line bg-white">
          {isObj<Media>(p.image) ? <img src={mediaUrl(p.image, 'card') ?? ''} alt={p.image.alt || p.name} className="block aspect-square w-full object-cover" loading="lazy" /> : null}
          <div className="p-4">
            <p className="m-0 font-display text-base font-bold text-brand-navy">{p.name}</p>
            <p className="mb-1 mt-1 font-bold text-[var(--color-accent)]">{p.price != null ? money(p.price) : 'Ask for price'}</p>
            {p.description ? <p className="m-0 text-sm text-brand-slate">{p.description}</p> : null}
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
      <h3 className="mb-2 text-base">{title}</h3>
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

export async function BusinessView({ biz }: { biz: BusinessFull }) {
  const pkg = effectivePackage(biz)
  const view = viewFor(pkg)
  const badge = badgeFor(pkg)
  const [promotions, products] = await Promise.all([
    getActivePromotions(biz.id),
    pkg && pkg.maxProducts > 0 ? getProducts(biz.id) : Promise.resolve([] as Product[]),
  ])

  const photos = (biz.gallery ?? []).filter(isObj<Media>)
  const priceLists = (biz.priceLists ?? []).filter(isObj<Document>)
  const certificates = (biz.certificates ?? []).filter(isObj<Document>)
  const categories = (biz.categories ?? []).filter((c) => typeof c === 'object')
  const logo = mediaUrl(biz.logo, 'thumb')
  const headerImage = view === 'premium' ? mediaUrl(biz.branding?.headerImage ?? null, 'hero') : null
  const brand = view === 'premium' && biz.branding?.brandColor ? biz.branding.brandColor : null
  const hasMap = biz.lat != null && biz.lng != null && (pkg ? pkg.mapPlacement : true)
  const path = bizPath(biz.slug)

  const overview = (
    <div className="grid gap-6">
      {biz.description ? <RichText data={biz.description} /> : biz.summary ? <p className="text-lg">{biz.summary}</p> : null}
      <Gallery photos={photos} big={view !== 'standard'} />
      {view === 'standard' ? (
        <div>
          <h2 className="mb-3 text-xl">Promotions</h2>
          <Promotions items={promotions} />
        </div>
      ) : null}
      {priceLists.length || certificates.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Files docs={priceLists} title="Price lists" />
          <Files docs={certificates} title="Certificates" />
        </div>
      ) : null}
    </div>
  )

  const tabs =
    view === 'standard'
      ? [{ id: 'overview', label: 'Overview', content: overview }]
      : [
          { id: 'overview', label: 'Overview', content: overview },
          ...(products.length ? [{ id: 'products', label: `Products (${products.length})`, content: <Products items={products} /> }] : []),
          { id: 'promotions', label: `Promotions${promotions.length ? ` (${promotions.length})` : ''}`, content: <Promotions items={promotions} /> },
        ]

  const titleBlock = (
    <div className="flex items-center gap-4">
      {logo ? <img src={logo} alt="" width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-lg border border-brand-line bg-white object-contain" /> : null}
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {badge && view !== 'standard' ? <span className={`badge ${badge.cls}`}>{badge.label}</span> : null}
          {categories.map((c, i) => (
            <Link key={c.id} href={`/${c.section === 'directory' ? 'directory' : c.section}/${c.slug}`} className="text-sm font-semibold text-[var(--color-accent)]">
              {c.name}
              {i < categories.length - 1 ? ' ·' : ''}
            </Link>
          ))}
        </div>
        <h1 className="m-0">{biz.name}</h1>
      </div>
    </div>
  )

  return (
    <main id="content" data-page="business" style={brand ? ({ '--brand': brand } as CSSProperties) : undefined}>
      <section className="section">
        <div className="container">
          {view !== 'premium' ? <AdSlot code="BUSINESS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" /> : null}

          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-brand-slate">
            <Link href="/directory" className="text-brand-slate hover:text-brand-red">
              Directory
            </Link>
            {categories[0] ? (
              <>
                <span aria-hidden="true"> / </span>
                <Link href={`/${categories[0].section}/${categories[0].slug}`} className="text-brand-slate hover:text-brand-red">
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
            <div className="mb-6">{titleBlock}</div>
          )}

          <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <Tabs tabs={tabs} />
            </div>
            {/* On phones the contacts come first — calling is what people came for. */}
            <aside className="order-first grid gap-[var(--grid-gap)] lg:order-none">
              <Contacts biz={biz} />
              {hasMap ? (
                <MapClient
                  height={260}
                  points={[{ id: String(biz.id), lat: biz.lat as number, lng: biz.lng as number, title: biz.name, subtitle: biz.address ?? undefined, kind: view }]}
                />
              ) : null}
              {view !== 'premium' ? (
                <>
                  <AdSlot code="BUSINESS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
                  {view === 'standard' ? (
                    <div className="widget">
                      <div className="widget-head">Is this your business?</div>
                      <div className="widget-body">
                        <p className="muted">Add photos, products and a branded page with a Luxury or Premium package.</p>
                        <Link href="/advertise" className="btn btn-sm btn-block">
                          See packages
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </>
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
          sameAs: Object.entries(biz.socials ?? {})
            .filter(([k, v]) => k !== 'id' && typeof v === 'string' && v)
            .map(([, v]) => withProto(v as string)),
        }}
      />
    </main>
  )
}
