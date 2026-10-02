import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { BizRow } from '@/components/business'
import { CarsCatalog } from '@/components/cars/CarsCatalog'
import { effectivePackage, withDescendants } from '@/lib/business'
import { toCarItem } from '@/lib/cars'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import { getCars } from '@/lib/queries-phase3'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cars for sale in Seattle',
  description: 'Used cars for sale in Seattle from local sellers and dealers, plus car repair, washes, parts and rental.',
  alternates: { canonical: '/cars' },
}

// The prototype's Auto catalog page, on real data (spec §13: layout as is
// until the client sends the redesign). Top to bottom: the Directory of
// Enterprises (auto businesses from the directory — Luxury, Premium, then
// Standard, the order the client asked for in the prototype), the middle
// banner, then Cars for Sale with the search bar and the catalog.

const FIRMS_ORDER: Record<string, number> = { luxury: 0, premium: 1, standard: 2 }

export default async function CarsPage() {
  const [cars, categories, businesses] = await Promise.all([getCars(), getBusinessCategories(), getAllBusinesses()])
  const auto = categories.find((c) => c.slug === 'auto-services')
  const autoIds = auto ? withDescendants(categories, auto.id) : new Set<number>()
  const catIds = (b: { categories: unknown[] }) =>
    (b.categories ?? []).map((c) => (typeof c === 'object' && c ? (c as { id: number }).id : (c as number)))
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
    .map((c) => ({ c, n: businesses.filter((b) => catIds(b).some((id) => withDescendants(categories, c.id).has(id))).length }))
    .filter((t) => t.n > 0)

  return (
    <main id="content" data-page="cars">
      <section className="section auto-catalog">
        <div className="container">
          <AdSlot code="CARS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          {firms.length ? (
            <>
              <div className="section-head section-head--btn-down auto-firms-head">
                <div>
                  <span className="eyebrow">Auto services</span>
                  <h2>Directory of enterprises</h2>
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
                      <div className="widget-body">
                        <ul className="auto-cats auto-cats--one">
                          {topics.map(({ c, n }) => (
                            <li key={c.id}>
                              <Link href={`/directory/${c.slug}`}>
                                <span>{c.name}</span>
                                <span className="auto-cats-num">{n}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </nav>
                  ) : null}
                  <AdSlot code="CARS_SIDEBAR_3" size="300x250" mobileSize="320x100" />
                </aside>
                <div className="auto-results">
                  <div className="biz-list" id="auto-firms">
                    {firms.map((b) => (
                      <BizRow key={b.id} biz={b} />
                    ))}
                  </div>
                </div>
                <aside className="auto-rail auto-rail--right">
                  <AdSlot code="CARS_SIDEBAR_4" size="300x600" mobileSize="320x100" />
                </aside>
              </div>
              <AdSlot code="CARS_INFEED_1" size="728x90" mobileSize="320x100" className="auto-mid-ad" />
            </>
          ) : null}

          <div className="section-head auto-head">
            <div>
              <span className="eyebrow">AllSeattle Auto</span>
              <h1>Cars for sale</h1>
            </div>
            <Link href="/advertise" className="btn">
              Place a listing
            </Link>
          </div>

          <CarsCatalog
            cars={cars.map(toCarItem)}
            rightRail={
              <>
                <AdSlot code="CARS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
                <AdSlot code="CARS_SIDEBAR_2" size="300x600" mobileSize="320x100" />
              </>
            }
          />
        </div>
      </section>
    </main>
  )
}
