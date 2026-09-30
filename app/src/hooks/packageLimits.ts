import { ValidationError, type Payload, type PayloadRequest } from 'payload'

import type { Package } from '@/payload-types'

// Package limits are enforced on save (spec §4, Packages): a business can't
// have more categories or photos than its package allows, can't have more
// products, promotions only when the package includes them, and so on. The
// error names the package and the number — "Luxury package allows up to 10
// categories" — so the salesperson knows what to change.
//
// A business without a package gets the limits of the cheapest one.

const relId = (v: unknown): number | null => {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'object' && 'id' in (v as object)) return (v as { id: number }).id
  return null
}

export async function packageFor(payload: Payload, pkg: unknown, req?: PayloadRequest): Promise<Package | null> {
  const id = relId(pkg)
  if (id) {
    try {
      return await payload.findByID({ collection: 'packages', id, depth: 0, req })
    } catch {
      return null
    }
  }
  const cheapest = await payload.find({ collection: 'packages', sort: 'order', limit: 1, depth: 0, req })
  return cheapest.docs[0] ?? null
}

const fail = (path: string, message: string): never => {
  throw new ValidationError({ errors: [{ path, message }] })
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Checks a business document against its package. Throws a ValidationError on the first breach. */
export async function assertBusinessWithinPackage(
  data: Record<string, unknown>,
  payload: Payload,
  req?: PayloadRequest,
) {
  const pkg = await packageFor(payload, data.package, req)
  if (!pkg) return
  const count = (v: unknown) => (Array.isArray(v) ? v.length : 0)

  const categories = count(data.categories)
  if (categories > pkg.maxCategories)
    fail('categories', `${pkg.name} package allows up to ${plural(pkg.maxCategories, 'category', 'categories')}`)

  const photos = count(data.gallery)
  if (photos > pkg.maxPhotos) fail('gallery', `${pkg.name} package allows up to ${plural(pkg.maxPhotos, 'photo')}`)

  if (!pkg.priceLists && (count(data.priceLists) > 0 || count(data.certificates) > 0))
    fail('priceLists', `${pkg.name} package doesn't include price lists and certificates`)

  if (!pkg.subdomain && typeof data.subdomain === 'string' && data.subdomain.trim() !== '')
    fail('subdomain', `${pkg.name} package doesn't include a subdomain`)
}

/** For child documents (products, promotions, later jobs and cars): the owning business's package. */
export async function packageOfBusiness(payload: Payload, business: unknown, req?: PayloadRequest) {
  const id = relId(business)
  if (!id) return null
  const biz = await payload.findByID({ collection: 'businesses', id, depth: 0, req }).catch(() => null)
  if (!biz) return null
  return packageFor(payload, biz.package, req)
}

/**
 * Throws when adding one more document of `collection` for `business` would
 * pass `limit`. `selfId` is excluded from the count, so re-saving an existing
 * document never trips the limit.
 */
export async function assertCountWithin(
  payload: Payload,
  opts: {
    collection: 'products' | 'promotions'
    business: unknown
    limit: number
    selfId?: number | string
    path: string
    message: string
    req?: PayloadRequest
  },
) {
  const id = relId(opts.business)
  if (!id) return
  const { totalDocs } = await payload.count({
    collection: opts.collection,
    where: {
      and: [{ business: { equals: id } }, ...(opts.selfId ? [{ id: { not_equals: opts.selfId } }] : [])],
    },
    req: opts.req,
  })
  if (totalDocs + 1 > opts.limit) fail(opts.path, opts.message)
}
