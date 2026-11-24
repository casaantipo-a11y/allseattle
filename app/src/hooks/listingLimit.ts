import type { CollectionBeforeChangeHook, Payload, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import { packageOfBusiness, plural } from './packageLimits'

// Car listings and job postings share one package limit, `maxListings`
// (spec §4: "Объявлений и вакансий"). Only documents tied to a business count —
// a private seller's car or a job with just a company name has no package.

/**
 * The refusal text when one more listing would pass the business's package limit, else null.
 * `own` is the listing being saved (not counted twice). Shared by the hook below and by the
 * account form, which asks before it stores the photos.
 */
export async function listingLimitMessage(
  payload: Payload,
  businessId: number,
  own: { collection: 'car-listings' | 'jobs'; id?: number | null },
  req?: PayloadRequest,
): Promise<string | null> {
  const pkg = await packageOfBusiness(payload, businessId, req)
  if (!pkg) return null
  const where = (collection: 'car-listings' | 'jobs') => ({
    and: [
      { [collection === 'car-listings' ? 'dealer' : 'business']: { equals: businessId } },
      ...(own.id && collection === own.collection ? [{ id: { not_equals: own.id } }] : []),
    ],
  })
  const [cars, jobs] = await Promise.all([
    payload.count({ collection: 'car-listings', where: where('car-listings'), req }),
    payload.count({ collection: 'jobs', where: where('jobs'), req }),
  ])
  if (cars.totalDocs + jobs.totalDocs + 1 <= pkg.maxListings) return null
  return `${pkg.name} package allows up to ${plural(pkg.maxListings, 'listing')} (car listings and jobs together)`
}

export const withinListingLimit =
  (businessField: 'dealer' | 'business'): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req, collection: self }) => {
    // `null` in the data is a real change (back to a private seller); `undefined` is "not sent".
    const business = data[businessField] !== undefined ? data[businessField] : originalDoc?.[businessField]
    const id = typeof business === 'object' && business ? (business as { id: number }).id : business
    if (!id) return data
    const message = await listingLimitMessage(req.payload, id, { collection: self.slug as 'car-listings' | 'jobs', id: originalDoc?.id }, req)
    if (message) throw new ValidationError({ errors: [{ path: businessField, message }] })
    return data
  }
