import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import type {
  BusinessCategory,
  Footer,
  Header,
  Media,
  News,
  NewsCategory,
  Package,
  Page,
  Product,
  Promotion,
  SeoText,
  SiteSetting,
} from '@/payload-types'

import type { BusinessFull } from './business'
import { SITE_TZ, seattleToday } from './site'

// Every public read goes through unstable_cache with a tag. Payload hooks
// expire the tag on save (src/hooks/revalidate.ts); the time-based
// `revalidate` is only a safety net. Server-side queries run without a user,
// so collection access already limits them to published documents — the
// explicit status filter below is belt and braces.

const HOUR = 3600
const payload = () => getPayload({ config })

const published: Where = { status: { equals: 'published' } }

export type NewsWithRelations = Omit<News, 'category' | 'cover'> & {
  category: NewsCategory
  cover?: Media | null
}

const asArticle = (doc: Pick<News, 'id'>) => doc as unknown as NewsWithRelations

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> => (await payload()).findGlobal({ slug: 'site-settings', depth: 1 }),
  ['site-settings'],
  { tags: ['site-settings'], revalidate: HOUR },
)

export const getHeader = unstable_cache(
  async (): Promise<Header> => (await payload()).findGlobal({ slug: 'header', depth: 1 }),
  ['header'],
  { tags: ['header'], revalidate: HOUR },
)

export const getFooter = unstable_cache(
  async (): Promise<Footer> => (await payload()).findGlobal({ slug: 'footer', depth: 0 }),
  ['footer'],
  { tags: ['footer'], revalidate: HOUR },
)

export const getSeoTexts = unstable_cache(
  async (): Promise<SeoText> => (await payload()).findGlobal({ slug: 'seo-texts', depth: 0 }),
  ['seo-texts'],
  { tags: ['seo-texts'], revalidate: HOUR },
)

export const getNewsCategories = unstable_cache(
  async (): Promise<NewsCategory[]> =>
    (await (await payload()).find({ collection: 'news-categories', limit: 100, sort: 'order', depth: 0 })).docs,
  ['news-categories'],
  { tags: ['news-categories'], revalidate: HOUR },
)

/** Published articles per category id, plus the total — for the Categories widget. */
export const getNewsCategoryCounts = unstable_cache(
  async (): Promise<{ total: number; byCategory: Record<number, number> }> => {
    const { docs } = await (
      await payload()
    ).find({ collection: 'news', where: published, limit: 5000, depth: 0, pagination: false, select: { category: true } })
    const byCategory: Record<number, number> = {}
    for (const d of docs) {
      const id = typeof d.category === 'object' && d.category ? d.category.id : d.category
      if (id) byCategory[id] = (byCategory[id] ?? 0) + 1
    }
    return { total: docs.length, byCategory }
  },
  ['news-category-counts'],
  { tags: ['news', 'news-categories'], revalidate: HOUR },
)

// News Archive (client, 12.10.2026): months are Seattle months, so a story
// published at 11 pm on the 30th stays in its month. The offset is found by
// trying PDT and PST — whichever lands on local midnight of the 1st.
const seattleMonthStart = (year: number, month: number) => {
  const mm = String(month).padStart(2, '0')
  for (const off of ['-07:00', '-08:00']) {
    const d = new Date(`${year}-${mm}-01T00:00:00${off}`)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: SITE_TZ, day: 'numeric', hour: 'numeric', hourCycle: 'h23' }).formatToParts(d)
    if (parts.find((x) => x.type === 'day')?.value === '1' && parts.find((x) => x.type === 'hour')?.value === '0') return d
  }
  return new Date(`${year}-${mm}-01T00:00:00-08:00`)
}
const monthRange = (year: number, month: number): Where => ({
  and: [
    { publishedAt: { greater_than_equal: seattleMonthStart(year, month).toISOString() } },
    {
      publishedAt: {
        less_than: (month === 12 ? seattleMonthStart(year + 1, 1) : seattleMonthStart(year, month + 1)).toISOString(),
      },
    },
  ],
})

/** The (year, month) pairs that have published stories, newest first — the Archive's options. */
export const getNewsMonths = unstable_cache(
  async (): Promise<{ year: number; month: number }[]> => {
    const res = await (await payload()).find({
      collection: 'news',
      where: published,
      select: { publishedAt: true },
      limit: 5000,
      depth: 0,
      pagination: false,
    })
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: SITE_TZ, year: 'numeric', month: 'numeric' })
    const seen = new Map<string, { year: number; month: number }>()
    for (const d of res.docs) {
      if (!d.publishedAt) continue
      const parts = fmt.formatToParts(new Date(d.publishedAt))
      const year = Number(parts.find((x) => x.type === 'year')?.value)
      const month = Number(parts.find((x) => x.type === 'month')?.value)
      seen.set(`${year}-${month}`, { year, month })
    }
    return [...seen.values()].sort((a, b) => b.year - a.year || b.month - a.month)
  },
  ['news-months'],
  { tags: ['news'], revalidate: HOUR },
)

export const getNewsPage = unstable_cache(
  async ({
    page = 1,
    limit = 20,
    categoryId,
    month,
    year,
  }: {
    page?: number
    limit?: number
    categoryId?: number
    /** 1–12; without a year, that month in every year that has stories. */
    month?: number
    year?: number
  }) => {
    const and: Where[] = [published]
    if (categoryId) and.push({ category: { equals: categoryId } })
    if (year && month) and.push(monthRange(year, month))
    else if (year) and.push({ publishedAt: { greater_than_equal: seattleMonthStart(year, 1).toISOString() } }, { publishedAt: { less_than: seattleMonthStart(year + 1, 1).toISOString() } })
    else if (month) {
      const years = [...new Set((await getNewsMonths()).map((m) => m.year))]
      and.push(years.length ? { or: years.map((y) => monthRange(y, month)) } : { id: { equals: -1 } })
    }
    const where: Where = and.length > 1 ? { and } : published
    const res = await (await payload()).find({
      collection: 'news',
      where,
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    })
    return {
      docs: res.docs.map(asArticle),
      page: res.page ?? 1,
      totalPages: res.totalPages,
      totalDocs: res.totalDocs,
    }
  },
  ['news-page'],
  { tags: ['news'], revalidate: HOUR },
)

export const getTopNews = unstable_cache(
  async (limit = 6): Promise<NewsWithRelations[]> =>
    (
      await (await payload()).find({
        collection: 'news',
        where: { and: [published, { isTop: { equals: true } }] },
        sort: '-publishedAt',
        limit,
        depth: 1,
      })
    ).docs.map(asArticle),
  ['top-news'],
  { tags: ['news'], revalidate: HOUR },
)

export const getArticle = unstable_cache(
  async (slug: string): Promise<NewsWithRelations | null> => {
    const res = await (await payload()).find({
      collection: 'news',
      where: { and: [published, { slug: { equals: slug } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ? asArticle(res.docs[0]) : null
  },
  ['article'],
  { tags: ['news'], revalidate: HOUR },
)

/** An article whose slug used to be `slug` — for the 301 from old URLs. */
export const findArticleByOldSlug = unstable_cache(
  async (slug: string): Promise<NewsWithRelations | null> => {
    const res = await (await payload()).find({
      collection: 'news',
      where: { and: [published, { 'slugHistory.slug': { equals: slug } }] },
      limit: 1,
      depth: 1,
    })
    return res.docs[0] ? asArticle(res.docs[0]) : null
  },
  ['article-old-slug'],
  { tags: ['news'], revalidate: HOUR },
)

export const getPage = unstable_cache(
  async (slug: string): Promise<Page | null> =>
    (
      await (await payload()).find({
        collection: 'pages',
        where: { and: [published, { slug: { equals: slug } }] },
        limit: 1,
        depth: 1,
      })
    ).docs[0] ?? null,
  ['page'],
  { tags: ['pages'], revalidate: HOUR },
)

export const findPageByOldSlug = unstable_cache(
  async (slug: string): Promise<Page | null> =>
    (
      await (await payload()).find({
        collection: 'pages',
        where: { and: [published, { 'slugHistory.slug': { equals: slug } }] },
        limit: 1,
        depth: 0,
      })
    ).docs[0] ?? null,
  ['page-old-slug'],
  { tags: ['pages'], revalidate: HOUR },
)

/** Everything the sitemaps need, light: slug, category slug, dates. */
export const getNewsForSitemap = unstable_cache(
  async (): Promise<NewsWithRelations[]> =>
    (
      await (await payload()).find({
        collection: 'news',
        where: published,
        sort: '-publishedAt',
        limit: 50000,
        depth: 1,
        select: { title: true, slug: true, category: true, publishedAt: true, updatedAt: true },
      })
    ).docs.map(asArticle),
  ['news-sitemap'],
  { tags: ['news'], revalidate: HOUR },
)

export const getPagesForSitemap = unstable_cache(
  async (): Promise<Pick<Page, 'slug' | 'updatedAt'>[]> =>
    (
      await (await payload()).find({
        collection: 'pages',
        where: published,
        limit: 1000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      })
    ).docs,
  ['pages-sitemap'],
  { tags: ['pages'], revalidate: HOUR },
)

// ---------------------------------------------------------------------------
// Businesses (phase 2)


const asBusiness = (doc: Pick<BusinessFull, 'id'>) => doc as unknown as BusinessFull

export const getBusinessCategories = unstable_cache(
  async (): Promise<BusinessCategory[]> =>
    (await (await payload()).find({ collection: 'business-categories', limit: 1000, sort: 'order', depth: 0 })).docs,
  ['business-categories'],
  { tags: ['business-categories'], revalidate: HOUR },
)

export const getPackages = unstable_cache(
  async (): Promise<Package[]> =>
    (await (await payload()).find({ collection: 'packages', limit: 20, sort: 'order', depth: 0 })).docs,
  ['packages'],
  { tags: ['packages'], revalidate: HOUR },
)

/**
 * Every published business with its package, categories and pictures. The
 * directory filters and sorts this in memory — ordering depends on package
 * expiry "today", which a database sort can't express, and a city directory
 * stays in the low thousands.
 */
export const getAllBusinesses = unstable_cache(
  async (): Promise<BusinessFull[]> =>
    (
      await (await payload()).find({
        collection: 'businesses',
        where: published,
        limit: 5000,
        depth: 1,
        select: {
          name: true,
          slug: true,
          summary: true,
          categories: true,
          cover: true,
          logo: true,
          address: true,
          lat: true,
          lng: true,
          phone: true,
          package: true,
          packageExpiresAt: true,
          priority: true,
          viewsCount: true,
          updatedAt: true,
        },
      })
    ).docs.map(asBusiness),
  ['businesses-all'],
  { tags: ['businesses', 'packages', 'business-categories'], revalidate: HOUR },
)

export const getBusiness = unstable_cache(
  async (slug: string): Promise<BusinessFull | null> => {
    const res = await (await payload()).find({
      collection: 'businesses',
      where: { and: [published, { slug: { equals: slug } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ? asBusiness(res.docs[0]) : null
  },
  ['business'],
  { tags: ['businesses', 'packages'], revalidate: HOUR },
)

export const findBusinessByOldSlug = unstable_cache(
  async (slug: string): Promise<BusinessFull | null> => {
    const res = await (await payload()).find({
      collection: 'businesses',
      where: { and: [published, { 'slugHistory.slug': { equals: slug } }] },
      limit: 1,
      depth: 0,
    })
    return res.docs[0] ? asBusiness(res.docs[0]) : null
  },
  ['business-old-slug'],
  { tags: ['businesses'], revalidate: HOUR },
)

export const getBusinessBySubdomain = unstable_cache(
  async (subdomain: string): Promise<BusinessFull | null> => {
    const res = await (await payload()).find({
      collection: 'businesses',
      where: { and: [published, { subdomain: { equals: subdomain } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ? asBusiness(res.docs[0]) : null
  },
  ['business-subdomain'],
  { tags: ['businesses', 'packages'], revalidate: HOUR },
)

/** Promotions running today (Seattle), from the start day to the end day inclusive.
 *  It used to compare the start with this very moment, and a start day stored as noon UTC
 *  kept a promotion off its own first day until 5 am Seattle (client, 17.10.2026). */
export const getActivePromotions = unstable_cache(
  async (businessId?: number): Promise<Promotion[]> => {
    const today = seattleToday()
    const where: Where = {
      and: [
        { validUntil: { greater_than_equal: `${today}T00:00:00.000Z` } },
        { validFrom: { less_than_equal: `${today}T23:59:59.999Z` } },
        ...(businessId ? [{ business: { equals: businessId } }] : []),
      ],
    }
    return (
      await (await payload()).find({ collection: 'promotions', where, sort: 'validUntil', limit: 200, depth: 1 })
    ).docs
  },
  ['promotions-active'],
  { tags: ['promotions'], revalidate: HOUR },
)

export const getProducts = unstable_cache(
  async (businessId: number): Promise<Product[]> =>
    (
      await (await payload()).find({
        collection: 'products',
        where: { business: { equals: businessId } },
        sort: 'name',
        limit: 1000,
        depth: 1,
      })
    ).docs,
  ['products'],
  { tags: ['products'], revalidate: HOUR },
)
