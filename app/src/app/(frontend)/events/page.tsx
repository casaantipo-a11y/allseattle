import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { EventCard } from '@/components/events'
import { EVENTS_COMING_SOON, WHEN, type When, categoryOf, inWindow } from '@/lib/events'
import { getAllUpcomingEvents, getEventCategories } from '@/lib/queries-phase3'

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
  const [events, categories] = EVENTS_COMING_SOON ? [[], []] : await Promise.all([getAllUpcomingEvents(), getEventCategories()])
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

          {EVENTS_COMING_SOON ? (
            // The section isn't open yet (client, 15.10.2026; switch in lib/events.ts). Heading,
            // "Submit an event" and both banner places stay.
            <div className="events-soon mx-auto my-10 max-w-[640px] rounded-xl border border-brand-line bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-brand-red" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </div>
              <div className="eyebrow">Coming soon</div>
              <div className="mt-2 font-display text-2xl font-bold text-brand-navy">Seattle events are on their way</div>
              <div className="mx-auto mt-3 max-w-[48ch] text-brand-slate">
                Concerts, food, community, family, art and sports events in one place — today, this weekend and this month. Hosting one?{' '}
                <Link href="/advertise" className="text-brand-navy underline">
                  Tell us about it
                </Link>
                .
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
          <AdSlot code="EVENTS_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-bottom mt-8" />
        </div>
      </section>
    </main>
  )
}
