import Link from 'next/link'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { DropPanel } from '@/components/DropPanel'
import { NewsArchiveWidget } from '@/components/NewsArchiveWidget'
import { NewsletterWidget } from '@/components/NewsletterWidget'
import { CategoriesWidget, NewsListRow, Pagination, TopNewsWidget } from '@/components/news'
import { getNewsCategories, getNewsCategoryCounts, getNewsMonths, getNewsPage, getTopNews } from '@/lib/queries'

// The news feed from the prototype's news.html: banner, head, three columns —
// ads and categories on the left, the feed, ads and Top news on the right.
// Shared by /news and /news/[category].
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** ?month=&year= from the News Archive; anything else is ignored. */
export function archiveParams(sp: { month?: string; year?: string }) {
  const month = Number(sp.month)
  const year = Number(sp.year)
  return {
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : undefined,
  }
}

export async function NewsSection({
  page,
  categorySlug,
  month,
  year,
}: {
  page: number
  categorySlug?: string
  month?: number
  year?: number
}) {
  const [categories, counts] = await Promise.all([getNewsCategories(), getNewsCategoryCounts()])
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !category) notFound()

  const [feed, top, months] = await Promise.all([
    getNewsPage({ page, limit: 20, categoryId: category?.id, month, year }),
    getTopNews(6),
    getNewsMonths(),
  ])
  if (page > 1 && page > feed.totalPages) notFound()

  const base = category ? `/news/${category.slug}` : '/news'
  const archive = { ...(month ? { month: String(month) } : {}), ...(year ? { year: String(year) } : {}) }
  const archiveLabel = [month ? MONTHS[month - 1] : null, year ?? null].filter(Boolean).join(' ')

  return (
    <main id="content" data-page="news">
      <section className="section news-list-section">
        <div className="container">
          <AdSlot code="NEWS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="section-head section-head--btn-down section-head--snug">
            <div>
              <span className="eyebrow">Seattle news</span>
              <h1>{category ? category.name : 'Latest stories'}</h1>
            </div>
            {/* Same card as Jobs' "Post a job" (client, 04.10.2026). The question is short on
                purpose: "Saw something newsworthy?" wrapped to two lines in the 300px card. */}
            <Link href="/share-news" className="post-card">
              <span className="post-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z" />
                  <path d="M17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3" />
                </svg>
              </span>
              <span className="post-card-text">
                <span className="post-card-kicker">Got a news tip?</span>
                <span className="post-card-title">Share the news</span>
              </span>
              <span className="post-card-go" aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="news-layout">
            {/* Left column per the client's News scheme (12.10.2026): A1 on top, then
                Categories and the prototype's Newsletter and News Archive, back. */}
            <aside className="news-rail news-rail--left">
              <AdSlot code="NEWS_SIDEBAR_2" size="300x600" mobileSize="320x100" />
              {/* Below 1024 the list is the "Category" button above the stories instead. */}
              <div className="from-1024">
                <CategoriesWidget categories={categories} activeSlug={category?.slug ?? undefined} counts={counts} />
              </div>
              <NewsletterWidget />
              <NewsArchiveWidget months={months} month={month} year={year} base={base} />
            </aside>

            <div className="news-feed">
              {/* Phones and tablets: the categories above the stories (client, 19.10.2026). */}
              <DropPanel className="below-1024" label="Category" current={category?.name ?? 'All news'}>
                <CategoriesWidget bare categories={categories} activeSlug={category?.slug ?? undefined} counts={counts} />
              </DropPanel>
              {category?.description ? <p className="muted">{category.description}</p> : null}
              {archiveLabel ? (
                <p className="muted">
                  Archive: {archiveLabel} &middot;{' '}
                  <Link href={base} className="text-brand-navy underline">
                    show all
                  </Link>
                </p>
              ) : null}
              {feed.docs.length ? (
                <div className="news-list">
                  {feed.docs.map((a, i) => (
                    <Fragment key={a.id}>
                      <NewsListRow article={a} />
                      {/* Phones and tablets: Top news inside the list, after the 5th story (client,
                          19.10.2026) — in the right column it came after the whole list. */}
                      {i === 4 && feed.docs.length > 5 && top.length ? (
                        <div className="below-1024 feed-widget news-feed-widget">
                          <TopNewsWidget articles={top} />
                        </div>
                      ) : null}
                      {/* B2 — the strip inside the list after the 10th story (client's scheme). */}
                      {i === 9 && feed.docs.length > 10 ? (
                        <AdSlot code="NEWS_INFEED_1" size="728x90" mobileSize="320x100" className="news-infeed-ad" />
                      ) : null}
                    </Fragment>
                  ))}
                </div>
              ) : (
                <p className="muted">{archiveLabel ? `No stories from ${archiveLabel}.` : 'No stories in this section yet.'}</p>
              )}
              <Pagination page={feed.page} totalPages={feed.totalPages} base={base} params={archive} />
            </div>

            <aside className="news-rail news-rail--right">
              <AdSlot code="NEWS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
              <div className="from-1024">
                <TopNewsWidget articles={top} />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
