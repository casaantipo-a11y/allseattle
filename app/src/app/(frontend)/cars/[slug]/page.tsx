import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { CarGallery } from '@/components/cars/CarGallery'
import { bizPath, telHref } from '@/lib/business'
import { BODY_LABEL, fmtMileage, fmtPrice, toCarItem } from '@/lib/cars'
import { mediaUrl } from '@/lib/media'
import { findCarByOldSlug, getCar, getCars } from '@/lib/queries-phase3'
import { absoluteUrl } from '@/lib/site'
import type { Business, CarMake, Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getCars()).filter((c) => c.slug).map((c) => ({ slug: c.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getCar((await params).slug)
  if (!car) return { title: 'Not found', robots: { index: false } }
  const item = toCarItem(car)
  const title = `${item.title} for sale — ${fmtPrice(item.price)}`
  const description = `${item.title}, ${fmtMileage(item.mileage)}, ${item.transmission}, ${item.fuel}. ${car.description ?? ''}`.slice(0, 300)
  return {
    title,
    description,
    alternates: { canonical: `/cars/${car.slug}` },
    openGraph: { type: 'website', title, description, url: `/cars/${car.slug}` },
  }
}

/* eslint-disable @next/next/no-img-element -- Payload renditions */

export default async function CarPage({ params }: Props) {
  const { slug } = await params
  const car = await getCar(slug)
  if (!car) {
    const moved = await findCarByOldSlug(slug)
    if (moved?.slug) permanentRedirect(`/cars/${moved.slug}`)
    notFound()
  }
  const item = toCarItem(car)
  const make = car.make as CarMake
  const photos = (car.photos ?? [])
    .filter((p): p is Media => typeof p === 'object' && p !== null)
    .map((m) => ({ src: mediaUrl(m, 'thumb') ?? '', full: mediaUrl(m, 'hero') ?? '' }))
  const dealer = typeof car.dealer === 'object' && car.dealer ? (car.dealer as Business) : null

  // Similar: same make or body type first, topped up with any other car to three.
  const others = (await getCars()).filter((c) => c.id !== car.id).map(toCarItem)
  const close = (c: typeof item) => c.make === item.make || c.bodyType === item.bodyType
  const similar = [...others.filter(close), ...others.filter((c) => !close(c))].slice(0, 3)

  const specs: [string, string | number | null | undefined][] = [
    ['Make', item.make],
    ['Model', car.model],
    ['Year', car.year],
    ['Mileage', fmtMileage(car.mileage)],
    ['Engine', car.engine],
    ['Transmission', car.transmission],
    ['Fuel', car.fuelType],
    ['Drivetrain', car.drivetrain],
    ['Body', BODY_LABEL[item.bodyType] ?? item.bodyType],
    ['Exterior color', car.exteriorColor],
    ['VIN', car.vin],
    ['Price', fmtPrice(car.price)],
  ]

  return (
    <main id="content" data-page="cars">
      <section className="section">
        <div className="container">
          <AdSlot code="CARS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <p>
            <Link href="/cars" className="muted text-sm underline">
              &larr; Back to catalog
            </Link>
          </p>

          <div className="listing-header">
            <div>
              <h1 className="mb-1">{item.title}</h1>
              <p className="muted mb-0">
                {fmtMileage(car.mileage)} &middot; {car.transmission}
                {car.engine ? <> &middot; {car.engine}</> : null}
              </p>
            </div>
            <div className="listing-price">{fmtPrice(car.price)}</div>
          </div>

          <div className="listing-layout">
            <div>
              <CarGallery photos={photos} alt={item.title} />
              {car.description ? (
                <>
                  {/* Inline: the prototype's unlayered h3 margin beats Tailwind's mt-*. */}
                  <h3 style={{ marginTop: 'var(--space-8)' }}>Description</h3>
                  <p className="muted">{car.description}</p>
                </>
              ) : null}
              <h3 style={{ marginTop: 'var(--space-6)' }}>Specifications</h3>
              <table className="spec-table">
                <tbody>
                  {specs
                    .filter(([, v]) => v != null && v !== '')
                    .map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="seller-card">
                <h3 className="mb-1.5">Seller</h3>
                <p className="muted mb-3.5">
                  {car.sellerName} &middot; {car.sellerPhone}
                </p>
                <a href={telHref(car.sellerPhone)} className="btn btn-block">
                  Call the seller
                </a>
                {dealer ? (
                  <p className="mb-0 mt-3 text-sm">
                    Sold by{' '}
                    <Link href={bizPath(dealer.slug)} className="text-brand-navy underline">
                      {dealer.name}
                    </Link>
                  </p>
                ) : null}
              </div>
              <AdSlot code="CARS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
            </div>
          </div>

          {similar.length ? (
            <div className="similar-cars mt-12">
              <div className="section-head">
                <div>
                  <h2>Similar cars</h2>
                </div>
              </div>
              <div className="grid car-grid">
                {similar.map((c) => (
                  <Link key={c.id} href={`/cars/${c.slug}`} className="card car-card">
                    <div className="car-card-photo">{c.photo ? <img src={c.photo} alt={c.title} loading="lazy" /> : null}</div>
                    <div className="car-card-body">
                      <div className="car-card-price">{fmtPrice(c.price)}</div>
                      <div className="car-card-title">{c.title}</div>
                      <div className="car-card-specs">
                        <span>{fmtMileage(c.mileage)}</span>
                        <span>&middot;</span>
                        <span>{c.transmission}</span>
                        {c.engine ? (
                          <>
                            <span>&middot;</span>
                            <span>{c.engine}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Car',
          name: item.title,
          brand: { '@type': 'Brand', name: make?.name },
          model: car.model,
          vehicleModelDate: String(car.year),
          mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'SMI' },
          vehicleTransmission: car.transmission,
          fuelType: car.fuelType,
          ...(car.vin ? { vehicleIdentificationNumber: car.vin } : {}),
          ...(car.exteriorColor ? { color: car.exteriorColor } : {}),
          ...(car.drivetrain ? { driveWheelConfiguration: car.drivetrain } : {}),
          ...(photos[0] ? { image: photos.map((p) => absoluteUrl(p.full)) } : {}),
          ...(car.description ? { description: car.description } : {}),
          offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: absoluteUrl(`/cars/${car.slug}`),
            ...(dealer ? { seller: { '@type': 'AutoDealer', name: dealer.name } } : {}),
          },
        }}
      />
    </main>
  )
}
