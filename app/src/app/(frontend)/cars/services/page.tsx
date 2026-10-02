import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
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

export default async function CarServicesPage() {
  const [categories, businesses] = await Promise.all([getBusinessCategories(), getAllBusinesses()])
  const auto = categories.find((c) => c.slug === 'auto-services')
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

  return (
    <main id="content" data-page="cars">
      <section className="section auto-catalog">
        <div className="container">
          <AdSlot
            code="CARS_SERVICES_TOP"
            size="728x90"
            mobileSize="320x100"
            className="ad-slot-top"
          />

          <div className="section-head section-head--btn-lower auto-firms-head">
            <div>
              <span className="eyebrow">Auto services</span>
              <h1>Directory of enterprises</h1>
            </div>
            <Link href="/directory/auto-services" className="btn btn-outline btn-sm">
              All auto businesses
            </Link>
          </div>
          <div className="auto-layout auto-layout--firms auto-firms-block">
            <aside className="auto-rail auto-rail--left">
              {topics.length ? (
                <nav className="widget" aria-label="Auto services">
                  <div className="widget-head">Headings</div>
                  <ul className="cat-list">
                    <li>
                      <Link href="/directory/auto-services" className="cat-row">
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
                </nav>
              ) : null}
              <AdSlot code="CARS_SIDEBAR_3" size="300x250" mobileSize="320x100" />
            </aside>
            <div className="auto-results">
              {firms.length ? (
                <div className="biz-list" id="auto-firms">
                  {firms.map((b) => (
                    <BizRow key={b.id} biz={b} />
                  ))}
                </div>
              ) : (
                <p className="muted">No auto businesses listed yet.</p>
              )}
            </div>
            <aside className="auto-rail auto-rail--right">
              <AdSlot code="CARS_SIDEBAR_4" size="300x600" mobileSize="320x100" />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
