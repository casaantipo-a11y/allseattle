// Shared shapes of the automatic import (events and news). Everything imported is
// saved as a draft; nothing here publishes anything.

export type ImportStats = {
  created: number
  skipped: number
  failed: number
  /** Why items were skipped, e.g. { exists: 30, 'no location': 2 }. */
  reasons: Record<string, number>
  /** The first message of a failed item, for the admin. */
  firstFailure?: string
  /** The whole source failed (network, rate limit, bad feed): items created before it still count. */
  error?: string
}

export const newStats = (): ImportStats => ({ created: 0, skipped: 0, failed: 0, reasons: {} })

export function skip(stats: ImportStats, reason: string) {
  stats.skipped++
  stats.reasons[reason] = (stats.reasons[reason] ?? 0) + 1
}

/** One event from any source, already cleaned: plain text only, UTC dates. */
export type EventCandidate = {
  externalId: string
  title: string
  startAt: Date
  endAt?: Date
  venueName: string
  address?: string
  lat?: number
  lng?: number
  isFree: boolean
  price?: string
  ticketUrl?: string
  /** Plain text (no markup) — becomes the rich text and the summary. */
  description?: string
  /** Slug of an event category; unknown slugs fall back to the source's default. */
  categorySlug?: string
}

/** How far ahead events are imported. */
export const WINDOW_DAYS = 60

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500)

/**
 * Postgres refused a duplicate: the unique (importSource, externalId) pair, or a slug.
 * Payload hands that over either as the raw error or as a ValidationError whose
 * `data.errors` say "Value must be unique".
 */
export const isUniqueViolation = (e: unknown) => {
  const err = e as { cause?: { code?: string }; message?: string; data?: { errors?: { message?: string }[] } } | null
  return (
    err?.cause?.code === '23505' ||
    /duplicate key|unique constraint/i.test(err?.message ?? '') ||
    !!err?.data?.errors?.some((x) => /must be unique/i.test(x.message ?? ''))
  )
}
