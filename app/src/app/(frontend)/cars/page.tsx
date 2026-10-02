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
      <section className="section auto-catalog">
        <div className="container">
          <AdSlot code="CARS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

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
