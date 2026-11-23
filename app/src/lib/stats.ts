import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { seattleDate } from './banners'

// Counters (22.11.2026). Views are counted in `view-stats` (daily rows) and, for a
// business, car or job, also in the document's lifetime `viewsCount`. Everything here
// reads or writes with plain SQL — a view must never go through payload.update, which
// would run the collection hooks and rebuild the cached pages.

/** A public number below this is not shown: "3 views" on a young site does harm. */
export const VIEWS_SHOW_MIN = 10
/** Same for "N price requests in 30 days" on a business page. */
export const REQUESTS_SHOW_MIN = 3
export const STATS_DAYS = 30

export type ViewKind = 'car' | 'job' | 'business'
/** Clicks on a business page, kept in `view-stats` under their own kind (`kind` is plain text; `views` holds the clicks). */
export type ClickKind = 'business-website' | 'business-call'
type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }
const db = async () => (await getPayload({ config })).db as unknown as Db

/** The first day of the 30-day window (today counts), Seattle time. */
export const windowStart = (now = Date.now()) => seattleDate(new Date(now - (STATS_DAYS - 1) * 86400000))

// Whitelisted: the table name goes into the SQL text, never a request value.
const TABLE: Record<ViewKind, string> = { car: 'car_listings', job: 'jobs', business: 'businesses' }

/**
 * One view of a car, job or business: the lifetime counter and today's row move together
 * in a single statement (a data-modifying CTE), so they cannot drift apart. Only a
 * published document counts; for any other id the statement does nothing.
 */
export async function recordView(kind: ViewKind, id: number) {
  await (await db()).drizzle.execute(sql`
    WITH hit AS (
      UPDATE ${sql.raw(`"${TABLE[kind]}"`)} SET "views_count" = COALESCE("views_count", 0) + 1
      WHERE "id" = ${id} AND "status" = 'published'
      RETURNING "id"
    )
    INSERT INTO "view_stats" ("kind", "doc_id", "date", "views", "updated_at", "created_at")
    SELECT ${kind}::text, "id", ${seattleDate()}::text, 1, now(), now() FROM hit
    ON CONFLICT ("kind", "doc_id", "date") DO UPDATE SET
      "views" = "view_stats"."views" + 1, "updated_at" = now()`)
}

/**
 * One click on "Website" or "Call" of a published business, into today's row of its click kind.
 * No lifetime counter and no document update. For an id that is not a published business the
 * statement inserts nothing.
 */
export async function recordClick(kind: ClickKind, id: number) {
  await (await db()).drizzle.execute(sql`
    INSERT INTO "view_stats" ("kind", "doc_id", "date", "views", "updated_at", "created_at")
    SELECT ${kind}::text, "id", ${seattleDate()}::text, 1, now(), now() FROM "businesses"
    WHERE "id" = ${id} AND "status" = 'published'
    ON CONFLICT ("kind", "doc_id", "date") DO UPDATE SET
      "views" = "view_stats"."views" + 1, "updated_at" = now()`)
}

/** One page view of the site (docId 0). */
export async function recordSiteView() {
  await (await db()).drizzle.execute(sql`
    INSERT INTO "view_stats" ("kind", "doc_id", "date", "views", "updated_at", "created_at")
    VALUES ('site', 0, ${seattleDate()}, 1, now(), now())
    ON CONFLICT ("kind", "doc_id", "date") DO UPDATE SET
      "views" = "view_stats"."views" + 1, "updated_at" = now()`)
}

/** Views per document over the last 30 days, all documents or just `ids`. Exact; uncached. */
export async function viewsByDoc(kind: ViewKind | ClickKind, ids?: number[]): Promise<Record<number, number>> {
  if (ids && !ids.length) return {}
  const only = ids ? sql`AND "doc_id" IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})` : sql``
  const res = await (await db()).drizzle.execute(sql`
    SELECT "doc_id", SUM("views") AS "n" FROM "view_stats"
    WHERE "kind" = ${kind} AND "date" >= ${windowStart()} ${only}
    GROUP BY "doc_id"`)
  return Object.fromEntries(res.rows.map((r) => [Number(r.doc_id), Number(r.n)]))
}

/** The same for the public pages: cached for an hour, like the pages that show it. */
export const getViews30 = unstable_cache(async (kind: ViewKind) => viewsByDoc(kind), ['views-30d'], {
  tags: ['view-stats'],
  revalidate: 3600,
})

/** A number for the public pages: only from VIEWS_SHOW_MIN up, else undefined. */
export const publicViews = (map: Record<number, number>, id: number): number | undefined => {
  const n = map[id] ?? 0
  return n >= VIEWS_SHOW_MIN ? n : undefined
}

export const viewsText = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'view' : 'views'} in 30 days`

/**
 * "Request a price" submissions per business over the last 30 days, all businesses or just `ids`.
 * Rejected ones (spam the team threw out) don't count. Exact; uncached.
 */
export async function requestsByBusiness(ids?: number[]): Promise<Record<number, number>> {
  if (ids && !ids.length) return {}
  const only = ids ? sql`AND "business_id" IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})` : sql``
  const res = await (await db()).drizzle.execute(sql`
    SELECT "business_id", COUNT(*) AS "n" FROM "submissions"
    WHERE "type" = 'price_request' AND "business_id" IS NOT NULL AND "status" <> 'rejected'
      AND "created_at" >= now() - interval '30 days' ${only}
    GROUP BY "business_id"`)
  return Object.fromEntries(res.rows.map((r) => [Number(r.business_id), Number(r.n)]))
}

/** The public copy: cached for an hour. Shown only from REQUESTS_SHOW_MIN up, and only as a number. */
export const getRequests30 = unstable_cache(async () => requestsByBusiness(), ['requests-30d'], {
  tags: ['view-stats'],
  revalidate: 3600,
})

export const publicRequests = (map: Record<number, number>, id: number): number | undefined => {
  const n = map[id] ?? 0
  return n >= REQUESTS_SHOW_MIN ? n : undefined
}

export const requestsText = (n: number) => `${n.toLocaleString('en-US')} price ${n === 1 ? 'request' : 'requests'} in 30 days`

export type AdvertiserStats = {
  /** First day with a counted view (YYYY-MM-DD), or null before the first one. */
  since: string | null
  last30: { siteViews: number; businessViews: number; requests: number; impressions: number; clicks: number }
  total: { siteViews: number; businessViews: number; requests: number; impressions: number; clicks: number }
}

/**
 * Aggregates for /advertise/stats — numbers only, nothing about a person or a named business.
 * Views from view-stats, price requests from submissions (rejected ones left out), banner
 * impressions and clicks from banner-stats (every banner, demo fillers included). One hour cache.
 */
export const getAdvertiserStats = unstable_cache(
  async (): Promise<AdvertiserStats> => {
    const d = await db()
    const since = windowStart()
    const [views, first, requests, banners] = await Promise.all([
      d.drizzle.execute(sql`
        SELECT "kind", SUM("views") AS "total", COALESCE(SUM("views") FILTER (WHERE "date" >= ${since}), 0) AS "last30"
        FROM "view_stats" WHERE "kind" IN ('site', 'business') GROUP BY "kind"`),
      d.drizzle.execute(sql`SELECT MIN("date") AS "first" FROM "view_stats"`),
      d.drizzle.execute(sql`
        SELECT COUNT(*) AS "total", COUNT(*) FILTER (WHERE "created_at" >= now() - interval '30 days') AS "last30"
        FROM "submissions" WHERE "type" = 'price_request' AND "status" <> 'rejected'`),
      d.drizzle.execute(sql`
        SELECT COALESCE(SUM("impressions"), 0) AS "impressions", COALESCE(SUM("clicks"), 0) AS "clicks",
          COALESCE(SUM("impressions") FILTER (WHERE "date" >= ${since}), 0) AS "impressions30",
          COALESCE(SUM("clicks") FILTER (WHERE "date" >= ${since}), 0) AS "clicks30"
        FROM "banner_stats"`),
    ])
    const v = (kind: string, col: 'total' | 'last30') => Number(views.rows.find((r) => r.kind === kind)?.[col] ?? 0)
    const r = requests.rows[0] ?? {}
    const b = banners.rows[0] ?? {}
    return {
      since: (first.rows[0]?.first as string | null) ?? null,
      last30: { siteViews: v('site', 'last30'), businessViews: v('business', 'last30'), requests: Number(r.last30 ?? 0), impressions: Number(b.impressions30 ?? 0), clicks: Number(b.clicks30 ?? 0) },
      total: { siteViews: v('site', 'total'), businessViews: v('business', 'total'), requests: Number(r.total ?? 0), impressions: Number(b.impressions ?? 0), clicks: Number(b.clicks ?? 0) },
    }
  },
  ['advertiser-stats'],
  { tags: ['view-stats', 'banners'], revalidate: 3600 },
)
