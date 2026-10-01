import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { BizRow, isPaid } from '@/components/business'
import { CarsCatalog } from '@/components/cars/CarsCatalog'
import { withDescendants } from '@/lib/business'
import { toCarItem } from '@/lib/cars'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import { getCars, getSiteStats } from '@/lib/queries-phase3'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cars for sale in Seattle',
  description: 'Used cars for sale in Seattle from local sellers and dealers, plus car repair, washes, parts and rental.',
  alternates: { canonical: '/cars' },
}

// The Cars page in the client's redesign (spec §13, mockup of 01.10.2026):
// head and search bar first; then three columns — left: model catalog, ad,
// auto-service headings, ad; middle: the auto businesses (every paid package
// as one "Gold" placement, alphabetical, then the standard ones, also
// alphabetical), a banner, "All cars" and the listings; right: ad, car
// statistics, ad.
export default async function CarsPage() {
  const [cars, categories, businesses, stats] = await Promise.all([getCars(), getBusinessCategories(), getAllBusinesses(), getSiteStats()])
  const auto = categories.find((c) => c.slug === 'auto-services')
  const autoIds = auto ? withDescendants(categories, auto.id) : new Set<number>()
  const catIds = (b: { categories: unknown[] }) =>
    (b.categories ?? []).map((c) => (typeof c === 'object' && c ? (c as { id: number }).id : (c as number)))
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  const autoFirms = businesses.filter((b) => catIds(b).some((id) => autoIds.has(id)))
  const firms = [...autoFirms.filter(isPaid).sort(byName), ...autoFirms.filter((b) => !isPaid(b)).sort(byName)]
  const topics = categories
    .filter((c) => auto && (typeof c.parent === 'object' ? c.parent?.id : c.parent) === auto.id)
    .map((c) => ({ c, n: businesses.filter((b) => catIds(b).some((id) => withDescendants(categories, c.id).has(id))).length }))
    .filter((t) => t.n > 0)

  return (
    <main id="content" data-page="cars">
      <section className="section auto-catalog">
        <div className="container">
          <AdSlot code="CARS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="section-head auto-head">
            <div>
              <span className="eyebrow">AllSeattle Auto</span>
              <h1>Cars for sale</h1>
            </div>
            <Link href="/advertise" className="btn">
              + Post a listing
            </Link>
          </div>

          <CarsCatalog
            cars={cars.map(toCarItem)}
            leftExtra={
              <>
                <AdSlot code="CARS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
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
                <AdSlot code="CARS_SIDEBAR_2" size="300x600" mobileSize="320x100" />
              </>
            }
            middleTop={
              firms.length ? (
                <>
                  <div className="biz-list mb-6" id="auto-firms" aria-label="Auto businesses">
                    {firms.map((b) => (
                      <BizRow key={b.id} biz={b} gold />
                    ))}
                  </div>
                  <AdSlot code="CARS_INFEED_1" size="728x90" mobileSize="320x100" className="auto-mid-ad" />
                </>
              ) : null
            }
            rightRail={
              <>
                <AdSlot code="CARS_SIDEBAR_3" size="300x250" mobileSize="320x100" />
                <div className="widget">
                  <div className="widget-head">Cars on AllSeattle</div>
                  <div className="widget-body">
                    <div className="stat-grid">
                      <div className="stat-tile">
                        <span className="num">{stats.cars.total.toLocaleString('en-US')}</span>
                        <span className="label">Cars for sale</span>
                      </div>
                      <div className="stat-tile">
                        <span className="num">{stats.cars.today.toLocaleString('en-US')}</span>
                        <span className="label">Added today</span>
                      </div>
                    </div>
                  </div>
                </div>
                <AdSlot code="CARS_SIDEBAR_4" size="300x250" mobileSize="320x100" />
              </>
            }
          />
        </div>
      </section>
    </main>
  )
}
