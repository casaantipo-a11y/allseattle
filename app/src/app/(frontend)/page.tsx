import Link from 'next/link'

import { AdSlot, InlineMobileAd } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { FreshCars, JobsWidget, StatsWidget, UpcomingEvents } from '@/components/home'
import { NewsListRow, NewsTile, TopNewsWidget } from '@/components/news'
import { getNewsPage, getSiteSettings, getTopNews } from '@/lib/queries'
import { getCars, getJobs, getSiteStats, getUpcomingEvents } from '@/lib/queries-phase3'
import { absoluteUrl } from '@/lib/site'

export const revalidate = 3600

// Home (spec §3): the prototype's layout on real data. The top leaderboard
// (HOME_TOP) is back — it had gone missing in the prototype. The contest is
// announced in the strip under the banner, like on every page. Then the latest news with Top news, site statistics and the job
// board on the right; then upcoming events, fresh cars and the newsfeed.
// Phase 4 fills every ad slot with real banners.

const TILE_COUNT = 20
// Mobile echoes of the left-column slots, after full rows of tiles.
const INLINE_AFTER = new Map([
  [6, 'HOME_SIDEBAR_1'],
  [12, 'HOME_SIDEBAR_2'],
])

export default async function HomePage() {
  const [settings, feed, top, stats, jobs, events, cars] = await Promise.all([
    getSiteSettings(),
    getNewsPage({ page: 1, limit: 32 }),
    getTopNews(6),
    getSiteStats(),
    getJobs(),
    getUpcomingEvents(),
    getCars(),
  ])
  const tiles = feed.docs.slice(0, TILE_COUNT)
  const list = feed.docs.slice(TILE_COUNT)
  const name = settings.siteName || 'AllSeattle'

  return (
    <main id="content" data-page="home">

      <section className="section">
        <div className="container" style={{ marginBottom: 'var(--space-6)' }}>
          <AdSlot code="HOME_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
        </div>
        <div className="container home-layout">
          <aside className="home-sidebar home-sidebar-left" aria-label="Advertising">
            <AdSlot code="HOME_SIDEBAR_1" size="300x250" className="ad-desktop-slot" />
            <AdSlot code="HOME_SIDEBAR_2" size="300x250" className="ad-desktop-slot" />
            <AdSlot code="HOME_SIDEBAR_3" size="300x600" className="ad-desktop-slot" />
          </aside>

          <div className="home-main">
            <div className="section-head section-head--btn-lower">
              <div>
                <span className="eyebrow">Today in Seattle</span>
                <h1>Latest news</h1>
              </div>
              <Link href="/news" className="btn btn-outline btn-sm">
                All news
              </Link>
            </div>
            {tiles.length ? (
              <div className="grid news-grid">
                {tiles.flatMap((a, i) => {
                  const inline = INLINE_AFTER.get(i + 1)
                  const tile = <NewsTile key={a.id} article={a} />
                  return inline ? [tile, <InlineMobileAd key={`ad-${inline}`} code={inline} />] : [tile]
                })}
              </div>
            ) : (
              <p className="muted">No news published yet.</p>
            )}
            <AdSlot code="HOME_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-bottom" />
          </div>

          <aside className="home-sidebar home-sidebar-right">
            <StatsWidget stats={stats} />
            <TopNewsWidget articles={top} />
            <JobsWidget jobs={jobs} />
          </aside>
        </div>
      </section>

      <UpcomingEvents events={events} />
      <FreshCars cars={[...cars].sort((a, b) => +new Date(b.bumpedAt || b.createdAt) - +new Date(a.bumpedAt || a.createdAt))} />

      {list.length ? (
        <section className="section home-feed">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">More from Seattle</span>
                <h2>City newsfeed</h2>
              </div>
            </div>
            <div className="news-list">
              {list.map((a) => (
                <NewsListRow key={a.id} article={a} />
              ))}
            </div>
            <AdSlot code="HOME_INFEED_2" size="728x90" mobileSize="320x100" className="ad-slot-bottom" />
          </div>
        </section>
      ) : null}
      {/* After the content: base.css styles `main > .section:first-child`, and a
          leading <script> would stop the first section from matching. */}
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name,
            url: absoluteUrl('/'),
            logo: absoluteUrl('/brand/logo.webp'),
            ...(settings.phone ? { telephone: settings.phone } : {}),
            ...(settings.email ? { email: settings.email } : {}),
            sameAs: [settings.socials?.facebook, settings.socials?.instagram].filter(Boolean),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name,
            url: absoluteUrl('/'),
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}` },
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
    </main>
  )
}
