import Link from 'next/link'

import { feedDate } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { NewsWithRelations } from '@/lib/queries'
import { articlePath } from '@/lib/site'

// The prototype's news components on real data (css: components.css,
// home.css, news.css). Dates use the feed format from the spec, in Seattle time.

const hrefOf = (a: NewsWithRelations) => articlePath(a.category?.slug ?? 'news', a.slug ?? '')

/* eslint-disable @next/next/no-img-element -- thumbnails are fixed-size CSS boxes from the prototype */

export function NewsTile({ article }: { article: NewsWithRelations }) {
  const href = hrefOf(article)
  const img = mediaUrl(article.cover, 'card')
  return (
    <article className="card news-card news-card--tile">
      <Link href={href} className="news-card-photo" tabIndex={-1} aria-hidden="true">
        {img ? <img src={img} alt="" loading="lazy" /> : null}
      </Link>
      <div className="news-card-body">
        <div className="news-card-meta">
          <span className="cat">{article.category?.name}</span>
          <time dateTime={article.publishedAt}>{feedDate(article.publishedAt)}</time>
        </div>
        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>
        <p className="news-card-excerpt">{article.excerpt}</p>
      </div>
    </article>
  )
}

export function NewsListRow({ article }: { article: NewsWithRelations }) {
  const img = mediaUrl(article.cover, 'thumb')
  return (
    <Link className="news-list-row" href={hrefOf(article)}>
      {img ? <img className="news-list-thumb" src={img} alt="" loading="lazy" /> : <span className="news-list-thumb" />}
      <span className="news-list-body">
        <span className="news-list-meta">
          <span className="cat">{article.category?.name}</span>
          <span>&middot;</span>
          <time dateTime={article.publishedAt}>{feedDate(article.publishedAt)}</time>
        </span>
        <span className="news-list-title">{article.title}</span>
        <span className="news-list-excerpt">{article.excerpt}</span>
      </span>
    </Link>
  )
}

export function TopNewsWidget({ articles }: { articles: NewsWithRelations[] }) {
  if (!articles.length) return null
  return (
    <div className="widget">
      <div className="widget-head">Top news</div>
      <div className="widget-body">
        <ol className="top-news">
          {articles.map((a, i) => {
            const img = mediaUrl(a.cover, 'thumb')
            return (
              <li key={a.id}>
                <Link className="top-news-row" href={hrefOf(a)}>
                  <span className="top-news-thumb">
                    {img ? <img src={img} alt="" loading="lazy" /> : null}
                    <span className="top-news-rank" aria-hidden="true">
                      {i + 1}
                    </span>
                  </span>
                  <span className="top-news-body">
                    {a.category?.name ? <span className="top-news-cat">{a.category.name}</span> : null}
                    <span className="top-news-title">{a.title}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

export function CategoriesWidget({
  categories,
  activeSlug,
  counts,
}: {
  categories: { id: number; name: string; slug?: string | null }[]
  activeSlug?: string
  counts?: { total: number; byCategory: Record<number, number> }
}) {
  const row = (href: string, label: string, active: boolean, n?: number) => (
    <li key={href}>
      <Link href={href} className={`news-cat${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
        <span>{label}</span>
        {n !== undefined ? <span className="news-cat-num">{n}</span> : null}
      </Link>
    </li>
  )
  return (
    <nav className="widget" aria-label="News categories">
      <div className="widget-head">Categories</div>
      <ul className="news-cats">
        {row('/news', 'All news', !activeSlug, counts?.total)}
        {categories
          .filter((c) => c.slug)
          .map((c) => row(`/news/${c.slug}`, c.name, activeSlug === c.slug, counts ? (counts.byCategory[c.id] ?? 0) : undefined))}
      </ul>
    </nav>
  )
}

export function Pagination({
  page,
  totalPages,
  base,
  params = {},
}: {
  page: number
  totalPages: number
  base: string
  params?: Record<string, string>
}) {
  if (totalPages <= 1) return null
  const href = (p: number) => {
    const qs = new URLSearchParams({ ...params, ...(p > 1 ? { page: String(p) } : {}) }).toString()
    return qs ? `${base}?${qs}` : base
  }
  return (
    <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-outline btn-sm" rel="prev">
          &larr; Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-brand-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn btn-outline btn-sm" rel="next">
          Older &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
