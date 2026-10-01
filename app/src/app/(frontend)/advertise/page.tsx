import type { Metadata } from 'next'

import { RichText } from '@/components/RichText'
import { SubmissionForm } from '@/components/SubmissionForm'
import { firstRunning, getAdSlots, getBannerPool } from '@/lib/banners'
import { badgeFor, priceText } from '@/lib/business'
import { getPackages, getPage } from '@/lib/queries'
import type { Package } from '@/payload-types'

// /advertise — the page salespeople show to clients (spec §5): the packages
// from the Packages collection, the map of banner placements (AdSlots) with
// their weekly price and whether a banner is running there right now, and the
// inquiry form. Markup and CSS are the prototype's pricing page
// (styles/pricing.css).

type Props = { searchParams: Promise<{ package?: string; slot?: string }> }

const PAGE_LABEL: Record<string, string> = {
  home: 'Home',
  news: 'News',
  directory: 'Business directory',
  shopping: 'Shopping',
  leisure: 'Leisure',
  business: 'Business pages',
  events: 'Events',
  cars: 'Cars',
  jobs: 'Jobs',
  weather: 'Weather',
  all: 'All pages',
}
const POSITION_LABEL: Record<string, string> = {
  leaderboard: 'Top banner',
  sidebar: 'Sidebar',
  'in-feed': 'In the feed',
}

export const metadata: Metadata = {
  title: 'Advertise on AllSeattle',
  description:
    'Placement packages for Seattle businesses: directory listing, city map, promotions, products and a branded page.',
  alternates: { canonical: '/advertise' },
}

const ROWS: { label: string; value: (p: Package) => boolean | number }[] = [
  { label: 'Directory categories', value: (p) => p.maxCategories },
  { label: 'Photos', value: (p) => p.maxPhotos },
  { label: 'Listings & job postings', value: (p) => p.maxListings },
  { label: 'Products', value: (p) => p.maxProducts },
  { label: 'Placement on the city map', value: (p) => Boolean(p.mapPlacement) },
  { label: 'Promotions', value: (p) => Boolean(p.promotions) },
  { label: 'Price lists & certificates', value: (p) => Boolean(p.priceLists) },
  { label: 'Own subdomain', value: (p) => Boolean(p.subdomain) },
  { label: 'Priority in the directory & search', value: (p) => Boolean(p.priorityPlacement) },
  {
    label: 'Banner in your category, first month',
    value: (p) => Boolean(p.categoryBannerFirstMonth),
  },
  { label: 'Branded business page', value: (p) => Boolean(p.brandedPage) },
]

function Cell({ v }: { v: boolean | number }) {
  if (v === true) return <td className="check">&#10003;</td>
  if (v === false || v === 0) return <td className="dash">&mdash;</td>
  return <td className="num">{v.toLocaleString('en-US')}</td>
}

export default async function AdvertisePage({ searchParams }: Props) {
  const [packages, page, sp, slots, pool] = await Promise.all([
    getPackages(),
    getPage('advertise'),
    searchParams,
    getAdSlots(),
    getBannerPool(),
  ])
  const chosen = packages.find((p) => String(p.id) === sp.package)
  const booked = (code: string) => firstRunning(pool[code] ?? []) >= 0
  const slotsByPage: [string, typeof slots][] = []
  for (const s of slots) {
    const group = slotsByPage.find(([k]) => k === s.page)
    if (group) group[1].push(s)
    else slotsByPage.push([s.page, [s]])
  }
  const slotName = (s: (typeof slots)[number]) =>
    s.name || `${PAGE_LABEL[s.page] ?? s.page} — ${POSITION_LABEL[s.position] ?? s.position}`
  // The middle tier is highlighted, as in the prototype.
  const featuredId = packages.length >= 3 ? packages[1].id : undefined

  return (
    <main id="content" data-page="advertise">
      <section className="section">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Advertise on AllSeattle</span>
            <h1>{page?.title && page.title !== 'Advertise' ? page.title : 'Placement packages'}</h1>
            <p className="muted lead">
              {page?.intro ||
                'Every package includes a listing in the directory, a place on the city map and a page for your business.'}
            </p>
          </div>

          <div className="pricing-grid">
            {packages.map((p) => {
              const featured = p.id === featuredId
              const badge = badgeFor(p)
              return (
                <div
                  key={p.id}
                  className={`card pricing-card${featured ? ' pricing-card--featured' : ''}`}
                >
                  {featured ? <span className="pricing-featured-tag">Most popular</span> : null}
                  <div className="pricing-card-head">
                    {badge ? (
                      <span className={`badge ${badge.cls} self-start`}>{p.name}</span>
                    ) : null}
                    <div className="pricing-price">
                      <span className="amount">
                        {p.priceMonthly > 0 || p.priceYearly <= 0
                          ? priceText(p.priceMonthly, p.currency)
                          : priceText(p.priceYearly, p.currency)}
                      </span>
                      {p.priceMonthly > 0 ? (
                        <span className="period">/mo</span>
                      ) : p.priceYearly > 0 ? (
                        <span className="period">/yr</span>
                      ) : null}
                    </div>
                  </div>
                  <ul className="pricing-cycles">
                    {/* Price rows only when there are prices; "Contact us" above says it once. */}
                    {p.priceMonthly > 0 ? (
                      <li>
                        <span>1 month</span>
                        <strong>{priceText(p.priceMonthly, p.currency)}</strong>
                      </li>
                    ) : null}
                    {p.priceYearly > 0 ? (
                      <li>
                        <span>12 months</span>
                        <strong>{priceText(p.priceYearly, p.currency)}</strong>
                      </li>
                    ) : null}
                    {(p.features ?? []).map((f) => (
                      <li key={f.id ?? f.text}>
                        <span>{f.text}</span>
                        <strong aria-hidden="true">&#10003;</strong>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`/advertise?package=${p.id}#inquiry`}
                    className={`btn btn-block${featured ? '' : ' btn-outline'}`}
                  >
                    Choose {p.name}
                  </a>
                </div>
              )
            })}
          </div>

          <div className="section-head section-head--spaced">
            <div>
              <span className="eyebrow">Compare packages</span>
              <h2>What&rsquo;s included</h2>
            </div>
          </div>
          <div className="table-scroll">
            <table className="feature-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {packages.map((p) => (
                    <th key={p.id}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label}>
                    <td className="feature-label">{r.label}</td>
                    {packages.map((p) => (
                      <Cell key={p.id} v={r.value(p)} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {slots.length ? (
            <>
              <div id="placements" className="section-head section-head--spaced scroll-mt-40">
                <div>
                  <span className="eyebrow">Banner placements</span>
                  <h2>Where your banner can run</h2>
                </div>
              </div>
              <p className="muted">
                Prices are per week. Booked means a banner is running there right now; ask us for
                the next free dates.
              </p>
              <div className="table-scroll">
                <table className="feature-table placements-table">
                  <thead>
                    <tr>
                      <th>Placement</th>
                      <th>Desktop</th>
                      <th>Phone</th>
                      <th>Per week</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  {slotsByPage.map(([pageKey, list]) => (
                    <tbody key={pageKey}>
                      <tr>
                        <th colSpan={5} className="placements-group">
                          {PAGE_LABEL[pageKey] ?? pageKey}
                        </th>
                      </tr>
                      {list.map((s) => {
                        const isBooked = booked(s.code)
                        return (
                          <tr key={s.id}>
                            <td className="feature-label">
                              <a href={`/advertise?slot=${encodeURIComponent(s.code)}#inquiry`}>
                                {slotName(s)}
                              </a>
                            </td>
                            <td className="num">{s.desktopSize}</td>
                            <td className="num">
                              {s.mobileSize ?? (
                                <span aria-label="not shown on phones">&mdash;</span>
                              )}
                            </td>
                            <td className="num">
                              {s.weeklyPrice > 0 ? priceText(s.weeklyPrice, 'USD') : 'Contact us'}
                            </td>
                            <td>
                              <span
                                className={`ad-slot-status ${isBooked ? 'is-occupied' : 'is-available'}`}
                              >
                                {isBooked ? 'Booked' : 'Available'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  ))}
                </table>
              </div>
            </>
          ) : null}

          {page?.content ? (
            <div className="mt-10">
              <RichText data={page.content} />
            </div>
          ) : null}

          <div id="inquiry" className="mx-auto mt-12 max-w-[640px] scroll-mt-40">
            <div className="section-head">
              <div>
                <span className="eyebrow">Get started</span>
                <h2>Place an ad</h2>
              </div>
            </div>
            <p className="muted">
              Tell us about your business and we&rsquo;ll get back to you with options. Nothing is
              charged now.
            </p>
            <SubmissionForm
              form="ad-inquiry"
              submitLabel="Send request"
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
              fields={[
                { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
                { name: 'businessName', label: 'Business name', autoComplete: 'organization' },
                {
                  name: 'email',
                  label: 'Email',
                  type: 'email',
                  autoComplete: 'email',
                  hint: 'Email or phone — one is enough.',
                },
                { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
                {
                  name: 'desiredPackage',
                  label: 'Package',
                  type: 'select',
                  options: packages.map((p) => ({ value: String(p.id), label: p.name })),
                  defaultValue: chosen ? String(chosen.id) : undefined,
                },
                ...(slots.length
                  ? [
                      {
                        name: 'desiredSlot',
                        label: 'Banner placement',
                        type: 'select' as const,
                        options: slots.map((s) => ({
                          value: s.code,
                          label: `${slotName(s)} (${s.desktopSize})`,
                        })),
                        defaultValue: slots.some((s) => s.code === sp.slot) ? sp.slot : undefined,
                      },
                    ]
                  : []),
                {
                  name: 'message',
                  label: 'Message',
                  type: 'textarea',
                  placeholder: 'Where would you like to appear, and from when?',
                },
              ]}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
