import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { AdSlot, Banner, Media } from '@/payload-types'

// Banner system, server side (spec §7). Pages are ISR, so the pool of banners
// is cached and the "is it running right now" check happens at render time
// and again in the browser (BannerSlot) — a banner stops showing at its endAt
// even if the page HTML was generated earlier.

const payload = () => getPayload({ config })
const FIVE_MIN = 300

export type BannerImage = { url: string; width: number; height: number }
export type ActiveBanner = {
  id: number
  advertiser: string
  startAt: string
  endAt: string
  desktop: BannerImage
  mobile: BannerImage | null
}

const image = (m: unknown): BannerImage | null => {
  const media = m as Media | null
  return media?.url && media.width && media.height
    ? { url: media.url, width: media.width, height: media.height }
    : null
}

/** Published banners that haven't ended, by slot code. */
export const getBannerPool = unstable_cache(
  async (): Promise<Record<string, ActiveBanner[]>> => {
    const { docs } = await (
      await payload()
    ).find({
      collection: 'banners',
      where: {
        and: [
          { status: { equals: 'published' } },
          { endAt: { greater_than: new Date().toISOString() } },
        ],
      },
      limit: 500,
      depth: 1,
      pagination: false,
    })
    const pool: Record<string, ActiveBanner[]> = {}
    for (const b of docs as Banner[]) {
      const desktop = image(b.imageDesktop)
      if (!desktop) continue
      const item: ActiveBanner = {
        id: b.id,
        advertiser: b.advertiser,
        startAt: b.startAt,
        endAt: b.endAt,
        desktop,
        mobile: image(b.imageMobile),
      }
      for (const s of b.slots ?? []) {
        const slot = s as AdSlot
        if (typeof slot !== 'object' || !slot.isActive) continue
        ;(pool[slot.code] ??= []).push(item)
      }
    }
    return pool
  },
  ['banner-pool'],
  // The time-based expiry is what lets a banner whose startAt has come show up
  // without anyone saving anything.
  { tags: ['banners', 'ad-slots'], revalidate: FIVE_MIN },
)

export const getAdSlots = unstable_cache(
  async (): Promise<AdSlot[]> =>
    (
      await (
        await payload()
      ).find({
        collection: 'ad-slots',
        where: { isActive: { equals: true } },
        limit: 500,
        sort: 'sortOrder',
        depth: 0,
        pagination: false,
      })
    ).docs,
  ['ad-slots'],
  { tags: ['ad-slots'], revalidate: 3600 },
)

export const isRunning = (b: Pick<ActiveBanner, 'startAt' | 'endAt'>, now = Date.now()) =>
  new Date(b.startAt).getTime() <= now && now < new Date(b.endAt).getTime()

/** Index of the first banner running right now, -1 if none — what the server renders. */
export const firstRunning = (banners: ActiveBanner[]) => {
  const now = Date.now()
  return banners.findIndex((b) => isRunning(b, now))
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|httpclient|java\//i
export const isBot = (ua: string | null) => !ua || BOT_UA.test(ua)

/** Today in Seattle as YYYY-MM-DD — the day a stat belongs to. */
export const seattleDate = (d = new Date()) =>
  d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })

/**
 * Adds to today's row for each banner, creating it if needed — one atomic
 * upsert on the unique (banner, date) index, so concurrent beacons never lose
 * a count or trip over each other.
 */
export async function recordBannerStats(
  entries: { id: number; impressions?: number; clicks?: number }[],
) {
  if (!entries.length) return
  const db = (await payload()).db as unknown as {
    drizzle: { execute: (q: unknown) => Promise<unknown> }
  }
  const date = seattleDate()
  for (const e of entries) {
    await db.drizzle.execute(sql`
      INSERT INTO "banner_stats" ("banner_id", "date", "impressions", "clicks", "updated_at", "created_at")
      VALUES (${e.id}, ${date}, ${e.impressions ?? 0}, ${e.clicks ?? 0}, now(), now())
      ON CONFLICT ("banner_id", "date") DO UPDATE SET
        "impressions" = "banner_stats"."impressions" + EXCLUDED."impressions",
        "clicks" = "banner_stats"."clicks" + EXCLUDED."clicks",
        "updated_at" = now()`)
  }
}

/** Ids of banners that exist and are published — what the tracking routes accept. */
export async function knownBannerIds(): Promise<Set<number>> {
  const pool = await getBannerPool()
  return new Set(
    Object.values(pool)
      .flat()
      .map((b) => b.id),
  )
}
