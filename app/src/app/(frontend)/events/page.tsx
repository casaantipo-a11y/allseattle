import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { EventCard } from '@/components/events'
import { WHEN, type When, categoryOf, inWindow } from '@/lib/events'
import { getEventCategories, getUpcomingEvents } from '@/lib/queries-phase3'

export const revalidate = 600

type Props = { searchParams: Promise<{ when?: string; category?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const filtered = Boolean(sp.when || sp.category)
  return {
    title: 'Events in Seattle',
    description: 'What is on in Seattle: concerts, food, community, family, art and sports events — today, this weekend and this month.',
    alternates: { canonical: '/events' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  }
}

// The prototype's events page (events.html, css: styles/events.css) on real
// data, plus the date filter from spec §5. Filters are links, so every view
// has its own URL and works without JavaScript.
export default async function EventsPage({ searchParams }: Props) {
  const sp = await searchParams
  const when = (WHEN.some((w) => w.value === sp.when) ? sp.when : 'all') as When
  const [events, categories] = await Promise.all([getUpcomingEvents(), getEventCategories()])
  const category = categories.find((c) => c.slug === sp.category)
  const list = events.filter((e) => inWindow(e, when) && (!category || categoryOf(e)?.id === category.id))
  const href = (w: When, c?: string | null) => {
    const q = new URLSearchParams({ ...(w !== 'all' ? { when: w } : {}), ...(c ? { category: c } : {}) }).toString()
    return q ? `/events?${q}` : '/events'
  }

  return (
    <main id="content" data-page="events">
      <section className="section events-section">
        <div className="container">
          <AdSlot code="EVENTS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="section-head section-head--sub section-head--snug events-head">
            <div>
              <span className="eyebrow">What is on</span>
              <h1>Seattle events</h1>
            </div>
            {/* The same card as Jobs' "Post a job" (client, 03.10.2026), at the right edge
                opposite the heading. */}
            <Link href="/advertise" className="post-card">
              <span className="post-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </span>
              <span className="post-card-text">
                <span className="post-card-kicker">Hosting an event?</span>
                <span className="post-card-title">Submit an event</span>
              </span>
              <span className="post-card-go" aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Period and category (client, 03 and 09.10.2026): the period as underline tabs
              (like Weather's Today / Week), the category as soft chips under them. The labels
              stay for screen readers only — the two rows explain themselves. */}
          <div className="events-filters">
            <div className="events-filter-row">
              <span className="events-filter-label" id="events-when-label">
                When
              </span>
              <nav className="events-when" aria-labelledby="events-when-label">
                {WHEN.map((w) => (
                  <Link key={w.value} href={href(w.value, category?.slug)} className={w.value === when ? 'active' : undefined} aria-current={w.value === when ? 'page' : undefined}>
                    {w.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="events-filter-row">
              <span className="events-filter-label" id="events-type-label">
                Category
              </span>
              <nav className="events-types" aria-labelledby="events-type-label">
                <Link href={href(when)} className={!category ? 'active' : undefined} aria-current={!category ? 'page' : undefined}>
                  All
                </Link>
                {categories.map((c) => (
                  <Link key={c.id} href={href(when, c.slug)} className={category?.id === c.id ? 'active' : undefined} aria-current={category?.id === c.id ? 'page' : undefined}>
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="events-layout">
            {list.length ? (
              <div className="grid event-grid">
                {list.map((e) => (
                  <EventCard key={e.id} ev={e} />
                ))}
              </div>
            ) : (
              <p className="muted">Nothing listed for that choice yet.</p>
            )}
          </div>
          <AdSlot code="EVENTS_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-bottom mt-8" />
        </div>
      </section>
    </main>
  )
}
