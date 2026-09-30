import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { TopNewsWidget } from '@/components/news'
import { feedDate } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { findArticleByOldSlug, getArticle, getNewsForSitemap, getSiteSettings, getTopNews } from '@/lib/queries'
import { absoluteUrl, articlePath } from '@/lib/site'
import type { Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ category: string; slug: string }> }

// Pre-render the newest articles at build time; the rest render on first visit
// and are cached from then on (ISR).
export async function generateStaticParams() {
  return (await getNewsForSitemap())
    .slice(0, 100)
    .filter((a) => a.slug && a.category?.slug)
    .map((a) => ({ category: a.category.slug as string, slug: a.slug as string }))
}

type Meta = { title?: string | null; description?: string | null; image?: number | Media | null }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Not found', robots: { index: false } }
  const meta = (article as unknown as { meta?: Meta }).meta ?? {}
  const title = meta.title?.replace(/\s*\|\s*AllSeattle$/, '') || article.title
  const description = meta.description || article.excerpt
  const path = articlePath(article.category.slug ?? '', article.slug ?? '')
  const customImage = mediaUrl(meta.image ?? null, 'hero')
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: article.category.name,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags ?? undefined,
      ...(customImage ? { images: [{ url: customImage }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { category, slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    // An old address of an article that has since been renamed → 301.
    const moved = await findArticleByOldSlug(slug)
    if (moved?.slug && moved.category?.slug) permanentRedirect(articlePath(moved.category.slug, moved.slug))
    notFound()
  }
  const canonicalPath = articlePath(article.category.slug ?? '', article.slug ?? '')
  // Right article, wrong category segment (it was moved) → 301 to the real one.
  if (article.category.slug !== category) permanentRedirect(canonicalPath)

  const [top, settings] = await Promise.all([getTopNews(6), getSiteSettings()])
  const cover = mediaUrl(article.cover, 'hero')
  const gallery = (article.gallery ?? []).filter((m): m is Media => typeof m === 'object' && m !== null)
  const isUrl = article.source ? /^https?:\/\//.test(article.source) : false

  return (
    <main id="content" data-page="news">
      <section className="section">
        <div className="container">
          <AdSlot code="NEWS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="news-layout">
            <aside className="news-rail news-rail--left">
              <AdSlot code="NEWS_SIDEBAR_2" size="300x600" mobileSize="320x100" />
            </aside>

            <article className="news-feed min-w-0">
              <nav aria-label="Breadcrumb" className="mb-3 text-sm text-brand-slate">
                <Link href="/news" className="text-brand-slate hover:text-brand-red">
                  News
                </Link>
                <span aria-hidden="true"> / </span>
                <Link href={`/news/${article.category.slug}`} className="text-brand-slate hover:text-brand-red">
                  {article.category.name}
                </Link>
              </nav>
              <h1 className="mb-3">{article.title}</h1>
              <p className="mb-2 text-lg text-brand-slate">{article.excerpt}</p>
              <p className="mb-5 text-sm text-brand-slate">
                <time dateTime={article.publishedAt}>{feedDate(article.publishedAt)}</time>
                {article.author ? <> &middot; {article.author}</> : null}
              </p>
              {cover ? (
                <figure className="mx-0 mb-6 mt-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Payload already serves a 1600px WebP rendition */}
                  <img
                    src={cover}
                    alt={mediaAlt(article.cover, article.title)}
                    className="block h-auto w-full rounded-lg"
                    width={typeof article.cover === 'object' ? (article.cover?.sizes?.hero?.width ?? undefined) : undefined}
                    height={typeof article.cover === 'object' ? (article.cover?.sizes?.hero?.height ?? undefined) : undefined}
                  />
                  {typeof article.cover === 'object' && article.cover?.credit ? (
                    <figcaption className="mt-2 text-xs text-brand-slate">{article.cover.credit}</figcaption>
                  ) : null}
                </figure>
              ) : null}

              <RichText data={article.content} />

              {gallery.length ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element -- card rendition from Payload
                    <img key={m.id} src={mediaUrl(m, 'card') ?? ''} alt={m.alt} loading="lazy" className="h-auto w-full rounded-lg" />
                  ))}
                </div>
              ) : null}

              {article.source ? (
                <p className="mt-6 text-sm text-brand-slate">
                  Source:{' '}
                  {isUrl ? (
                    <a href={article.source} rel="noopener nofollow" target="_blank" className="text-brand-navy underline">
                      {new URL(article.source).hostname}
                    </a>
                  ) : (
                    article.source
                  )}
                </p>
              ) : null}

              {article.tags?.length ? (
                <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                  {article.tags.map((t) => (
                    <li key={t} className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs text-brand-slate">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-8">
                <Link href="/share-news" className="btn btn-navy">
                  Share the news
                </Link>
              </div>
            </article>

            <aside className="news-rail news-rail--right">
              <AdSlot code="NEWS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
              <TopNewsWidget articles={top.filter((a) => a.id !== article.id)} />
            </aside>
          </div>
        </div>
      </section>
      {/* After the content: base.css styles `main > .section:first-child`, and a
          leading <script> would stop the first section from matching. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          mainEntityOfPage: absoluteUrl(canonicalPath),
          articleSection: article.category.name,
          image: [absoluteUrl(cover ?? `${canonicalPath}/opengraph-image`)],
          author: article.author
            ? { '@type': 'Person', name: article.author }
            : { '@type': 'Organization', name: settings.siteName || 'AllSeattle' },
          publisher: {
            '@type': 'Organization',
            name: settings.siteName || 'AllSeattle',
            logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/logo.png') },
          },
          ...(article.tags?.length ? { keywords: article.tags.join(', ') } : {}),
        }}
      />
    </main>
  )
}
