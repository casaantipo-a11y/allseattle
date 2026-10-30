import { sql } from '@payloadcms/db-postgres'
import type { CollectionAfterDeleteHook, Payload } from 'payload'

import type { ImportSource } from '@/payload-types'

// An editor who deletes an imported draft means "not this one". The importer only knows what
// is in the database, so a deleted item looked new again and came back the next morning —
// events for as long as they stay inside the 60-day window. Deleting one now leaves its
// external id on the source (`dismissed`, id → time) and the importer skips it.
//
// The write is one SQL statement, not read-then-save: deleting twenty drafts in the admin
// runs the hooks side by side, and each would save the list it read, dropping the others.

/** Kept this long: events are read 60 days ahead and news 3 days back, so later it can't return. */
const KEEP_DAYS = 70
const DAY = 24 * 3600 * 1000

type Db = { drizzle: { execute: (q: unknown) => Promise<unknown> } }
const dbOf = (payload: Payload) => payload.db as unknown as Db

/**
 * afterDelete of News and Events. The importer's own cleanup of old drafts passes
 * `context.importCleanup` and is not a rejection.
 */
export const rememberDismissed: CollectionAfterDeleteHook = async ({ doc, req, context }) => {
  if (context?.importCleanup || doc?.origin !== 'import' || !doc.externalId) return doc
  const source = typeof doc.importSource === 'object' ? doc.importSource?.id : doc.importSource
  if (!source) return doc
  try {
    await dbOf(req.payload).drizzle.execute(sql`
      UPDATE "import_sources"
      SET "dismissed" = COALESCE("dismissed", '{}'::jsonb) || jsonb_build_object(${String(doc.externalId)}::text, ${Date.now()}::bigint)
      WHERE "id" = ${Number(source)}`)
  } catch (e) {
    // Never block the deletion itself.
    console.error('[import] could not remember a deleted draft', e)
  }
  return doc
}

/** The external ids an editor deleted from this source. */
export function dismissedOf(source: ImportSource): Set<string> {
  const d = source.dismissed
  return new Set(d && typeof d === 'object' && !Array.isArray(d) ? Object.keys(d) : [])
}

/** Forgets the ones old enough that the source can no longer offer them. */
export async function pruneDismissed(payload: Payload, now = Date.now()) {
  await dbOf(payload).drizzle.execute(sql`
    UPDATE "import_sources"
    SET "dismissed" = (
      SELECT COALESCE(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
      FROM jsonb_each("dismissed") AS e
      WHERE (e.value #>> '{}')::bigint >= ${now - KEEP_DAYS * DAY}::bigint)
    WHERE "dismissed" IS NOT NULL AND "dismissed" <> '{}'::jsonb`)
}
