import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { SeoText } from '@/components/SeoText'
import { seoDescription } from '@/lib/seo-texts'
import { ComingSoon } from '@/components/ComingSoon'
import { EventCategoryMenu } from '@/components/EventCategoryMenu'
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
    description: await seoDescription('events', 'What is on in Seattle: concerts, food, community, family, art and sports events — today, this weekend and this month.'),
    alternates: { canonical: '/events' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  }
}

/** "Hosting one? Tell us about it." on a line of its own under the text, the link unbroken
 *  (client, 20.10.2026: at the end of the paragraph "it." wrapped alone onto a new line). */
function HostingLine() {
  return (
    <div className="mt-2 text-brand-slate">
      Hosting one?{' '}
      <Link href="/advertise" className="whitespace-nowrap text-brand-navy underline">
        Tell us about it
      </Link>
      .
    </div>
  )
}

/** The "Coming soon" card: the whole section while it's closed, and "All upcoming" with no events. */
const EventsSoon = ({ className }: { className?: string }) => (
  <ComingSoon
    className={className}
    icon="calendar"
    title="Seattle events are on their way"
    text="Concerts, food, community, family, art and sports events in one place — today, this weekend and this month."
    lead="Hosting one?"
    linkLabel="Tell us about it"
    href="/advertise"
  />
)

const WHEN_PHRASE: Record<When, string> = { all: 'coming up', today: 'today', weekend: 'this weekend', month: 'this month' }

/** Events exist, but none for the chosen period / category: say so instead of "Coming soon"
 *  (client, 20.10.2026 — "Today" with nothing on showed the "on their way" card). */
function EventsNone({ when, category, allHref }: { when: When; category?: string; allHref: string }) {
  const title = category ? `No ${category} events ${WHEN_PHRASE[when]}` : `No events ${WHEN_PHRASE[when]}`
  return (
    <div className="events-soon mx-auto max-w-[640px] rounded-xl border border-brand-line bg-white px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-brand-red" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4M10 13.5l4 4M14 13.5l-4 4" />
        </svg>
      </div>
      <div className="font-display text-2xl font-bold text-brand-navy">{title}</div>
      <div className="mx-auto mt-3 max-w-[44ch] text-brand-slate">
        Nothing is listed for that yet — try another day or see everything that is coming up.
      </div>
      <HostingLine />
      <Link href={allHref} className="btn btn-sm mt-6">
        See all upcoming events
      </Link>
    </div>
  )
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
  // Events in the chosen period per category, for the left column's counts.
  const inPeriod = events.filter((e) => inWindow(e, when))
  const countOf = (id: number) => inPeriod.filter((e) => categoryOf(e)?.id === id).length
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
            <Link href="/advertise" className="post-card events-post-head">
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
            <>
              <EventsSoon className="mt-10" />
              <AdSlot code="EVENTS_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
            </>
          ) : (
            <>
            <div className="events-layout events-layout--cats">
              {/* From 1024 the categories are an open list in a left column, as in the other
                  sections (client, 20.10.2026); below 1024 they stay the "Category" button. */}
              <aside className="events-cats from-1024-block">
                {/* "Submit an event" at the top of the left column, as "Post a job" on Jobs
                    (client, 20.10.2026); the head's copy is hidden from 1024. */}
                <Link href="/advertise" className="post-card events-post-side">
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
                <nav className="widget" aria-label="Event categories">
                  <div className="widget-head">Categories</div>
                  <ul className="cat-list">
                    <li>
                      <Link href={href(when)} className={`cat-row${!category ? ' is-active' : ''}`} aria-current={!category ? 'page' : undefined}>
                        <span>All events</span>
                        <span className="cat-num">{inPeriod.length}</span>
                      </Link>
                    </li>
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={href(when, c.slug)}
                          className={`cat-row${category?.id === c.id ? ' is-active' : ''}`}
                          aria-current={category?.id === c.id ? 'page' : undefined}
                        >
                          <span>{c.name}</span>
                          <span className="cat-num">{countOf(c.id)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <div className="events-main">
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
                      <EventCategoryMenu
                        current={category?.name ?? 'All'}
                        all={{ label: 'All categories', href: href(when), active: !category }}
                        options={categories.map((c) => ({ label: c.name, href: href(when, c.slug), active: category?.id === c.id }))}
                      />
                    </nav>
                  </div>
                </div>
                {list.length ? (
                  <div className="grid event-grid">
                    {list.map((e) => (
                      <EventCard key={e.id} ev={e} />
                    ))}
                  </div>
                ) : events.length || when !== 'all' || category ? (
                  // Nothing for the chosen period / category: "No events today", "No events this
                  // weekend"… and a way back — even while no events exist at all (client, 20.10.2026).
                  <EventsNone when={when} category={category?.name} allHref={href('all')} />
                ) : (
                  // "All upcoming" with no events at all: the "Coming soon" card (client, 18.10.2026); the
                  // filters above give its top gap.
                  <EventsSoon />
                )}
                {/* B2 in the main column, 16px under its last line (client, 20.10.2026: under the
                    whole layout it dropped below the taller Categories column). */}
                <AdSlot code="EVENTS_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
              </div>
            </div>
            </>
          )}
        </div>
      </section>
      {/* The client's SEO text, without filters only. */}
      {when === 'all' && !category ? <SeoText section="events" /> : null}
    </main>
  )
}
