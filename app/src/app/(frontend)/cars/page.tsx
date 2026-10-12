import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { CarsCatalog } from '@/components/cars/CarsCatalog'
import { toCarItem } from '@/lib/cars'
import { getCars } from '@/lib/queries-phase3'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cars for sale in Seattle',
  description:
    'Used cars for sale in Seattle from local sellers and dealers: search by make, model, price and year.',
  alternates: { canonical: '/cars' },
}

// Cars → For sale: the prototype's car catalog on real data — search bar,
// model catalog, listings. The auto businesses (Directory of enterprises)
// have their own page, /cars/services (client's request, 02.10.2026).
export default async function CarsPage() {
  const cars = await getCars()

  return (
    <main id="content" data-page="cars">
      <section className="section auto-catalog cars-list-section">
        <div className="container">
          <AdSlot code="CARS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top ad-slot-top--in-head" />

          <div className="section-head auto-head">
            <div>
              <span className="eyebrow">AllSeattle Auto</span>
              <h1>Cars for sale</h1>
            </div>
            {/* Same card as Jobs' "Post a job" (client, 04.10.2026). */}
            <Link href="/advertise" className="post-card">
              <span className="post-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h14M5 17a2 2 0 1 1-4 0v-4l2-5h18l2 5v4a2 2 0 1 1-4 0" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </span>
              <span className="post-card-text">
                <span className="post-card-kicker">Selling a car?</span>
                <span className="post-card-title">Place a listing</span>
              </span>
              <span className="post-card-go" aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <CarsCatalog
            cars={cars.map(toCarItem)}
            feedAd={<AdSlot code="CARS_INFEED_1" size="728x90" mobileSize="320x100" />}
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
