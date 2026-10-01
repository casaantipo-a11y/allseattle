import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

import { packageOfBusiness, plural } from './packageLimits'

// Car listings and job postings share one package limit, `maxListings`
// (spec §4: "Объявлений и вакансий"). Only documents tied to a business count —
// a private seller's car or a job with just a company name has no package.
export const withinListingLimit =
  (businessField: 'dealer' | 'business'): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req, collection: self }) => {
    const business = data[businessField] ?? originalDoc?.[businessField]
    const id = typeof business === 'object' && business ? (business as { id: number }).id : business
    if (!id) return data
    const pkg = await packageOfBusiness(req.payload, id, req)
    if (!pkg) return data
    const where = (collection: 'car-listings' | 'jobs') => ({
      and: [
        { [collection === 'car-listings' ? 'dealer' : 'business']: { equals: id } },
        ...(originalDoc?.id && collection === self.slug ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    })
    const [cars, jobs] = await Promise.all([
      req.payload.count({ collection: 'car-listings', where: where('car-listings'), req }),
      req.payload.count({ collection: 'jobs', where: where('jobs'), req }),
    ])
    if (cars.totalDocs + jobs.totalDocs + 1 > pkg.maxListings) {
      throw new ValidationError({
        errors: [
          {
            path: businessField,
            message: `${pkg.name} package allows up to ${plural(pkg.maxListings, 'listing')} (car listings and jobs together)`,
          },
        ],
      })
    }
    return data
  }
