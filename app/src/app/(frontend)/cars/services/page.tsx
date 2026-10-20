import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'

import { AdSlot } from '@/components/AdSlot'
import { ComingSoon } from '@/components/ComingSoon'
import { DropPanel } from '@/components/DropPanel'
import { BizRow } from '@/components/business'
import { effectivePackage, withDescendants } from '@/lib/business'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Auto services in Seattle',
  description:
    'Seattle car repair, washes, tires, parts, dealerships, rentals and driving schools — the auto businesses of the AllSeattle directory.',
  alternates: { canonical: '/cars/services' },
}

// Cars → Services: the Directory of enterprises, split off the Cars page into
// its own sub-section (client's request, 02.10.2026); the header shows
// "Cars  Services / For sale". Auto businesses from the directory, paid
// packages first (Luxury, Premium, then Standard); the headings on the left
// link to the directory categories.

const FIRMS_ORDER: Record<string, number> = { luxury: 0, premium: 1, standard: 2 }

/** The side columns' banners inside the list below 1024px: after company 3 and 6. */
const FEED_ADS = [
  { code: 'CARS_SIDEBAR_3', size: '300x250' as const, after: 3 },
  { code: 'CARS_SIDEBAR_4', size: '300x600' as const, after: 6 },
]

export default async function CarServicesPage() {
  const [categories, businesses] = await Promise.all([getBusinessCategories(), getAllBusinesses()])
  // The directory's Automotive section (13-section tree, 12.10.2026; was "Auto Services").
  // Before the seed has run on a database the section is still the old "Auto Services".
  const auto = categories.find((c) => c.slug === 'automotive') ?? categories.find((c) => c.slug === 'auto-services')
  const autoIds = auto ? withDescendants(categories, auto.id) : new Set<number>()
  const catIds = (b: { categories: unknown[] }) =>
    (b.categories ?? []).map((c) =>
      typeof c === 'object' && c ? (c as { id: number }).id : (c as number),
    )
  const firms = businesses
    .filter((b) => catIds(b).some((id) => autoIds.has(id)))
    .sort((a, b) => {
      const k = (x: typeof a) => {
        const p = effectivePackage(x)
        return FIRMS_ORDER[p?.brandedPage ? 'premium' : p?.priorityPlacement ? 'luxury' : 'standard']
      }
      return k(a) - k(b) || a.name.localeCompare(b.name)
    })
  const topics = categories
    .filter((c) => auto && (typeof c.parent === 'object' ? c.parent?.id : c.parent) === auto.id)
    .map((c) => ({
      c,
      n: businesses.filter((b) => catIds(b).some((id) => withDescendants(categories, c.id).has(id)))
        .length,
    }))
    .filter((t) => t.n > 0)

  const topicList = (
    <ul className="cat-list">
      <li>
        <Link href={`/directory/${auto?.slug ?? 'automotive'}`} className="cat-row">
          <span>All auto services</span>
          <span className="cat-num">{firms.length}</span>
        </Link>
      </li>
      {topics.map(({ c, n }) => (
        <li key={c.id}>
          <Link href={`/directory/${c.slug}`} className="cat-row">
            <span>{c.name}</span>
            <span className="cat-num">{n}</span>
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <main id="content" data-page="cars">
      <section className="section auto-catalog section--footer-tight">
        <div className="container">
          <AdSlot
            code="CARS_SERVICES_TOP"
            size="728x90"
            mobileSize="320x100"
            className="ad-slot-top"
          />

          <div className="section-head section-head--btn-lower section-head--snug auto-firms-head">
            <div>
              <span className="eyebrow">Auto services</span>
              <h1>Directory of enterprises</h1>
            </div>
            <Link href={`/directory/${auto?.slug ?? 'automotive'}`} className="btn btn-outline btn-sm">
              All auto businesses
            </Link>
          </div>
          <div className="auto-layout auto-layout--firms auto-firms-block">
            <aside className="auto-rail auto-rail--left">
              {/* Below 1024 the list is the "Category" button above the companies instead. */}
              {topics.length ? (
                <div className="from-1024">
                  <nav className="widget" aria-label="Auto services">
                    <div className="widget-head">Headings</div>
                    {topicList}
                  </nav>
                </div>
              ) : null}
              <div className="from-1024">
                <AdSlot code="CARS_SIDEBAR_3" size="300x250" mobileSize="320x100" />
              </div>
            </aside>
            <div className="auto-results">
              {/* Phones and tablets: the categories above the list (client, 19.10.2026). */}
              {topics.length ? (
                <DropPanel className="below-1024" label="Category" current="All auto services">
                  <nav aria-label="Auto services">{topicList}</nav>
                </DropPanel>
              ) : null}
              {firms.length ? (
                <div className="biz-list" id="auto-firms">
                  {firms.map((b, i) => (
                    <Fragment key={b.id}>
                      <BizRow biz={b} />
                      {/* Below 1024 the side columns' banners stand inside the list — under it they
                          ended up three in a row with the B2 (client, 19.10.2026). Same places. */}
                      {FEED_ADS.filter((a) => a.after === i + 1).map((a) => (
                        <div key={a.code} className="below-1024">
                          <AdSlot code={a.code} size={a.size} mobileSize="320x100" className="biz-infeed-ad" />
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              ) : (
                // Nothing listed yet: the "Coming soon" card (client, 20.10.2026).
                <ComingSoon
                  icon="wrench"
                  title="Auto businesses are on their way"
                  text="Repair shops, dealers, detailing, tires and rentals around Seattle."
                  lead="Run an auto business?"
                  linkLabel="Add your business"
                  href="/add-business"
                />
              )}
              {FEED_ADS.filter((a) => a.after > firms.length).map((a) => (
                <div key={a.code} className="below-1024">
                  <AdSlot code={a.code} size={a.size} mobileSize="320x100" className="biz-infeed-ad" />
                </div>
              ))}
              {/* B2 under the main content ("other sections" scheme, 12.10.2026) — in the list's
                  column, 16px under its last line (client, 20.10.2026: under the whole layout it
                  dropped below the taller side columns). */}
              <AdSlot code="CARS_SERVICES_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
            </div>
            <aside className="auto-rail auto-rail--right">
              <div className="from-1024">
                <AdSlot code="CARS_SIDEBAR_4" size="300x600" mobileSize="320x100" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
