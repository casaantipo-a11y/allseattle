import Link from 'next/link'

import { categoryOf, dateParts, priceLabel } from '@/lib/events'
import { mediaUrl } from '@/lib/media'
import type { Event } from '@/payload-types'

// The prototype's event card (components.css / styles/events.css), linking to
// the event page.
export function EventCard({ ev }: { ev: Event }) {
  const d = dateParts(ev.startAt)
  const cat = categoryOf(ev)
  const img = mediaUrl(ev.image, 'card')
  return (
    <article className="card event-card">
      <Link href={`/events/${ev.slug}`} className="event-photo" tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- card rendition */}
        {img ? <img src={img} alt="" loading="lazy" /> : null}
        <div className="event-date">
          <span className="m">{d.month}</span>
          <span className="d">{d.day}</span>
        </div>
      </Link>
      <div className="event-body">
        <div className="event-meta">
          {cat ? <span className="cat">{cat.name}</span> : null}
          <span>&middot;</span>
          <span>
            {d.weekday}, {d.time}
          </span>
        </div>
        <h3 className="event-title">
          <Link href={`/events/${ev.slug}`}>{ev.title}</Link>
        </h3>
        <div className="event-venue">{ev.venueName}</div>
        {ev.summary ? <p className="event-desc">{ev.summary}</p> : null}
        <div className="event-price">{priceLabel(ev)}</div>
      </div>
    </article>
  )
}
