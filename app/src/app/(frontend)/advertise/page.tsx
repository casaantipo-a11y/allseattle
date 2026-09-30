import type { Metadata } from 'next'

import { RichText } from '@/components/RichText'
import { SubmissionForm } from '@/components/SubmissionForm'
import { badgeFor, priceText } from '@/lib/business'
import { getPackages, getPage } from '@/lib/queries'
import type { Package } from '@/payload-types'

// /advertise — the page salespeople show to clients (spec §5). Phase 2: the
// packages table from the Packages collection and the inquiry form. The map
// of ad placements with Available/Booked arrives with banners in phase 4.
// Markup and CSS are the prototype's pricing page (styles/pricing.css).

type Props = { searchParams: Promise<{ package?: string }> }

export const metadata: Metadata = {
  title: 'Advertise on AllSeattle',
  description: 'Placement packages for Seattle businesses: directory listing, city map, promotions, products and a branded page.',
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
  { label: 'Banner in your category, first month', value: (p) => Boolean(p.categoryBannerFirstMonth) },
  { label: 'Branded business page', value: (p) => Boolean(p.brandedPage) },
]

function Cell({ v }: { v: boolean | number }) {
  if (v === true) return <td className="check">&#10003;</td>
  if (v === false || v === 0) return <td className="dash">&mdash;</td>
  return <td className="num">{v.toLocaleString('en-US')}</td>
}

export default async function AdvertisePage({ searchParams }: Props) {
  const [packages, page, sp] = await Promise.all([getPackages(), getPage('advertise'), searchParams])
  const chosen = packages.find((p) => String(p.id) === sp.package)
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
                <div key={p.id} className={`card pricing-card${featured ? ' pricing-card--featured' : ''}`}>
                  {featured ? <span className="pricing-featured-tag">Most popular</span> : null}
                  <div className="pricing-card-head">
                    {badge ? <span className={`badge ${badge.cls} self-start`}>{p.name}</span> : null}
                    <div className="pricing-price">
                      <span className="amount">
                        {p.priceMonthly > 0 || p.priceYearly <= 0 ? priceText(p.priceMonthly, p.currency) : priceText(p.priceYearly, p.currency)}
                      </span>
                      {p.priceMonthly > 0 ? <span className="period">/mo</span> : p.priceYearly > 0 ? <span className="period">/yr</span> : null}
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
                  <a href={`/advertise?package=${p.id}#inquiry`} className={`btn btn-block${featured ? '' : ' btn-outline'}`}>
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
            <p className="muted">Tell us about your business and we&rsquo;ll get back to you with options. Nothing is charged now.</p>
            <SubmissionForm
              form="ad-inquiry"
              submitLabel="Send request"
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
              fields={[
                { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
                { name: 'businessName', label: 'Business name', autoComplete: 'organization' },
                { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Email or phone — one is enough.' },
                { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
                {
                  name: 'desiredPackage',
                  label: 'Package',
                  type: 'select',
                  options: packages.map((p) => ({ value: String(p.id), label: p.name })),
                  defaultValue: chosen ? String(chosen.id) : undefined,
                },
                { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Where would you like to appear, and from when?' },
              ]}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
