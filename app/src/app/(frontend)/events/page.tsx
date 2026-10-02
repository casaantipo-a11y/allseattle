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
      <section className="section">
        <div className="container">
          <AdSlot code="EVENTS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />

          <div className="section-head section-head--sub section-head--btn-low section-head--btn-raise">
            <div>
              <span className="eyebrow">What is on</span>
              <h1>Seattle events</h1>
            </div>
            <Link href="/advertise" className="btn">
              Submit an event
            </Link>
          </div>

          <nav className="category-filter" aria-label="When">
            {WHEN.map((w) => (
              <Link key={w.value} href={href(w.value, category?.slug)} className={w.value === when ? 'active' : undefined} aria-current={w.value === when ? 'page' : undefined}>
                {w.label}
              </Link>
            ))}
          </nav>
          <nav className="category-filter" aria-label="Category">
            <Link href={href(when)} className={!category ? 'active' : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={href(when, c.slug)} className={category?.id === c.id ? 'active' : undefined}>
                {c.name}
              </Link>
            ))}
          </nav>

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
