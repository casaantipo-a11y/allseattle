import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import type { CarListing } from '@/payload-types'

import { mediaIds } from './cabinet'

// Car-form photos that were uploaded (POST /api/account/photos) but never saved with a
// listing, removed by the daily cron once they are 24 hours old. Only a `staged` file with
// an `uploadedBy` is ever touched. As a second guard, a staged file that a car listing does
// hold (the release after the save failed) is released, never deleted.

const STALE_MS = 24 * 3600 * 1000
const BATCH = 100
/** Stop starting new batches after this long (the cron has a minute in all); what is left goes tomorrow. */
const BUDGET_MS = 25 * 1000

/** All stale photos, a batch at a time, until none are left or the time budget is used up. */
export async function dropStalePhotos(now = Date.now()): Promise<{ deleted: number; released: number }> {
  const payload = await getPayload({ config })
  const started = Date.now()
  const total = { deleted: 0, released: 0 }
  for (;;) {
    const { deleted, released, looked } = await dropBatch(payload, now)
    total.deleted += deleted
    total.released += released
    if (looked < BATCH || Date.now() - started > BUDGET_MS) return total
  }
}

async function dropBatch(payload: Awaited<ReturnType<typeof getPayload>>, now: number): Promise<{ deleted: number; released: number; looked: number }> {
  const before = new Date(now - STALE_MS).toISOString()
  const where: Where = {
    and: [{ staged: { equals: true } }, { uploadedBy: { exists: true } }, { createdAt: { less_than: before } }],
  }
  const { docs } = await payload.find({ collection: 'media', where, limit: BATCH, depth: 0, pagination: false, sort: 'createdAt', overrideAccess: true })
  if (!docs.length) return { deleted: 0, released: 0, looked: 0 }
  const ids = docs.map((d) => d.id)

  const holders = await payload.find({
    collection: 'car-listings',
    where: { photos: { in: ids } },
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const held = new Set((holders.docs as CarListing[]).flatMap((c) => mediaIds(c.photos)))
  const toRelease = ids.filter((i) => held.has(i))
  const toDelete = ids.filter((i) => !held.has(i))

  if (toRelease.length) {
    await payload.update({ collection: 'media', where: { id: { in: toRelease } }, data: { staged: false } as never, overrideAccess: true })
  }
  if (toDelete.length) {
    // Same conditions again in the delete itself: nothing else can match.
    await payload.delete({ collection: 'media', where: { and: [{ id: { in: toDelete } }, { staged: { equals: true } }, { uploadedBy: { exists: true } }] }, overrideAccess: true })
  }
  return { deleted: toDelete.length, released: toRelease.length, looked: docs.length }
}
