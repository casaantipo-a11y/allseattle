import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  GlobalAfterChangeHook,
} from 'payload'

// Pages are ISR. Every public query is wrapped in unstable_cache with a tag
// (src/lib/queries.ts), and these hooks expire those tags the moment an editor
// saves or deletes something, so a published article shows up without waiting
// for the time-based revalidation.
//
// Outside a Next.js request (the seed and purge scripts run under
// `payload run`) there is no incremental cache to talk to and the calls throw;
// that is expected and ignored. Scripts also pass `context.disableRevalidate`.

const expire = (tags: string[], paths: string[] = []) => {
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    for (const path of paths) revalidatePath(path)
  } catch {
    // not inside Next.js — nothing to revalidate
  }
}

type PathsFor = (doc: Record<string, unknown>) => string[]

export const revalidateCollection = (
  tags: string[],
  pathsFor: PathsFor = () => [],
): { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook } => ({
  afterChange: ({ doc, previousDoc, context }) => {
    if (!context?.disableRevalidate) {
      expire(tags, [...pathsFor(doc), ...(previousDoc ? pathsFor(previousDoc) : [])])
    }
    return doc
  },
  afterDelete: ({ doc, context }) => {
    if (!context?.disableRevalidate) expire(tags, pathsFor(doc))
    return doc
  },
})

export const revalidateGlobal =
  (tags: string[]): GlobalAfterChangeHook =>
  ({ doc, context }) => {
    if (!context?.disableRevalidate) expire(tags, ['/'])
    return doc
  }

/**
 * Keeps the previous slug in `slugHistory` when an editor changes it, so the
 * old URL keeps working as a 301 (spec §9).
 */
export const rememberOldSlug: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  if (operation !== 'update' || !originalDoc?.slug || !data.slug) return data
  if (originalDoc.slug === data.slug) return data
  const history: { slug: string }[] = Array.isArray(originalDoc.slugHistory)
    ? originalDoc.slugHistory.map((h: { slug: string }) => ({ slug: h.slug }))
    : []
  const next = history.filter((h) => h.slug !== data.slug)
  if (!next.some((h) => h.slug === originalDoc.slug)) next.push({ slug: originalDoc.slug })
  return { ...data, slugHistory: next }
}
