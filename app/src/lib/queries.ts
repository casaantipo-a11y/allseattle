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
  SiteSetting,
} from '@/payload-types'

import type { BusinessFull } from './business'

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

export const getNewsPage = unstable_cache(
  async ({ page = 1, limit = 20, categoryId }: { page?: number; limit?: number; categoryId?: number }) => {
    const where: Where = categoryId ? { and: [published, { category: { equals: categoryId } }] } : published
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

/** Promotions still running today; expired ones never show. */
export const getActivePromotions = unstable_cache(
  async (businessId?: number): Promise<Promotion[]> => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const where: Where = {
      and: [
        { validUntil: { greater_than_equal: today.toISOString() } },
        { validFrom: { less_than_equal: new Date().toISOString() } },
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
