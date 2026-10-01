import type { CarItem } from '@/components/cars/CarsCatalog'
import type { CarListing, CarMake, Media } from '@/payload-types'

import { mediaUrl } from './media'

// Turns a Payload car listing into the plain object the catalog renders.
export function toCarItem(c: CarListing): CarItem {
  const make = typeof c.make === 'object' ? (c.make as CarMake).name : ''
  const cover = (c.photos ?? []).find((p): p is Media => typeof p === 'object' && p !== null)
  return {
    id: c.id,
    slug: c.slug ?? String(c.id),
    title: c.title || `${c.year} ${make} ${c.model}`,
    make,
    model: c.model,
    year: c.year,
    price: c.price,
    mileage: c.mileage,
    engine: c.engine,
    transmission: c.transmission,
    fuel: c.fuelType,
    bodyType: c.bodyType,
    color: c.exteriorColor,
    description: c.description,
    photo: mediaUrl(cover, 'card'),
    postedAt: c.bumpedAt || c.createdAt,
    ref: `A-${String(c.id).padStart(4, '0')}`,
    featured: Boolean(c.isFeatured),
  }
}

export const fmtPrice = (n: number) => `$${n.toLocaleString('en-US')}`
export const fmtMileage = (n: number) => `${n.toLocaleString('en-US')} mi`

export const BODY_LABEL: Record<string, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  hatchback: 'Hatchback',
  coupe: 'Coupe',
  convertible: 'Convertible',
  wagon: 'Wagon',
  van: 'Van / minivan',
}
