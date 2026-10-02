import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { CategoriesWidget, NewsListRow, Pagination, TopNewsWidget } from '@/components/news'
import { getNewsCategories, getNewsCategoryCounts, getNewsPage, getTopNews } from '@/lib/queries'

// The news feed from the prototype's news.html: banner, head, three columns —
// ads and categories on the left, the feed, ads and Top news on the right.
// Shared by /news and /news/[category].
export async function NewsSection({ page, categorySlug }: { page: number; categorySlug?: string }) {
  const [categories, counts] = await Promise.all([getNewsCategories(), getNewsCategoryCounts()])
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !category) notFound()

  const [feed, top] = await Promise.all([
    getNewsPage({ page, limit: 20, categoryId: category?.id }),
    getTopNews(6),
  ])
  if (page > 1 && page > feed.totalPages) notFound()

  const base = category ? `/news/${category.slug}` : '/news'

  return (
    <main id="content" data-page="news">
      <section className="section">
        <div className="container">
          <AdSlot code="NEWS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="section-head section-head--btn-down">
            <div>
              <span className="eyebrow">Seattle news</span>
              <h1>{category ? category.name : 'Latest stories'}</h1>
            </div>
            <Link href="/share-news" className="btn btn-navy">
              + Share the news
            </Link>
          </div>

          <div className="news-layout">
            <aside className="news-rail news-rail--left">
              <CategoriesWidget categories={categories} activeSlug={category?.slug ?? undefined} counts={counts} />
              <AdSlot code="NEWS_SIDEBAR_2" size="300x600" mobileSize="320x100" />
            </aside>

            <div className="news-feed">
              {category?.description ? <p className="muted">{category.description}</p> : null}
              {feed.docs.length ? (
                <div className="news-list">
                  {feed.docs.map((a) => (
                    <NewsListRow key={a.id} article={a} />
                  ))}
                </div>
              ) : (
                <p className="muted">No stories in this section yet.</p>
              )}
              <Pagination page={feed.page} totalPages={feed.totalPages} base={base} />
            </div>

            <aside className="news-rail news-rail--right">
              <AdSlot code="NEWS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
              <TopNewsWidget articles={top} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
