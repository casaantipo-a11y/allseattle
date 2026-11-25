import { APIError, type CollectionBeforeDeleteHook, type CollectionSlug, type Where } from 'payload'

// What the admin must not delete from under the site (QA 25.11.2026). Postgres either refuses
// ("Something went wrong") or, where the column may be empty, quietly lets go: deleting the Premium
// package left six businesses with no package at all. These hooks answer with a sentence instead.
// They apply to a person in the admin or the REST API; a script or server code that deletes
// through the local API has no user and has checked what it removes itself.

type Use = { collection: CollectionSlug; field: string; label: string }

/** Refuses to delete a row that documents of other collections still point to. */
export const refuseWhileUsed =
  (uses: Use[]): CollectionBeforeDeleteHook =>
  async ({ id, req }) => {
    if (!req.user) return
    for (const u of uses) {
      const where = { [u.field]: { equals: id } } as Where
      const { totalDocs } = await req.payload.count({ collection: u.collection, where, overrideAccess: true, req })
      if (totalDocs) {
        throw new APIError(`Can’t delete it: it is still used by ${u.label} (${totalDocs}). Move ${totalDocs === 1 ? 'it' : 'them'} to another one first.`, 400, null, true)
      }
    }
  }

/** A site account whose subscription still renews can't be deleted: Stripe would go on charging it. */
export const refuseWhileSubscribed: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (!req.user) return
  for (const collection of ['businesses', 'banners'] as const) {
    const { totalDocs } = await req.payload.count({
      collection,
      where: { and: [{ owner: { equals: id } }, { subscriptionStatus: { in: ['active', 'past_due'] } }] },
      overrideAccess: true,
      req,
    })
    if (totalDocs) {
      throw new APIError('This account still has a subscription that renews every month. Cancel it in Stripe first (what was paid for stays until its end), then delete the account.', 400, null, true)
    }
  }
}
