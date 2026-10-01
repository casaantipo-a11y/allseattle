import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { MapClient } from '@/components/map/MapClient'
import { categoryOf, dateParts, priceLabel } from '@/lib/events'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { findEventByOldSlug, getEvent, getUpcomingEvents } from '@/lib/queries-phase3'
import { absoluteUrl } from '@/lib/site'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getUpcomingEvents()).filter((e) => e.slug).map((e) => ({ slug: e.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ev = await getEvent((await params).slug)
  if (!ev) return { title: 'Not found', robots: { index: false } }
  const d = dateParts(ev.startAt)
  const title = `${ev.title} — ${d.weekday} ${d.month.charAt(0)}${d.month.slice(1).toLowerCase()} ${d.day}`
  const description = [ev.venueName, priceLabel(ev), ev.summary].filter(Boolean).join(' · ').slice(0, 300)
  return { title, description, alternates: { canonical: `/events/${ev.slug}` }, openGraph: { title, description, url: `/events/${ev.slug}` } }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const ev = await getEvent(slug)
  if (!ev) {
    const moved = await findEventByOldSlug(slug)
    if (moved?.slug) permanentRedirect(`/events/${moved.slug}`)
    notFound()
  }
  const start = dateParts(ev.startAt)
  const end = ev.endAt ? dateParts(ev.endAt) : null
  const cat = categoryOf(ev)
  const img = mediaUrl(ev.image, 'hero')
  const price = priceLabel(ev)

  return (
    <main id="content" data-page="events">
      <section className="section">
        <div className="container">
          <AdSlot code="EVENTS_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <p>
            <Link href="/events" className="muted text-sm underline">
              &larr; All events
            </Link>
          </p>
          <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="min-w-0">
              {cat ? <p className="mb-1 text-sm font-bold uppercase tracking-wide text-brand-red">{cat.name}</p> : null}
              <h1 className="mb-3">{ev.title}</h1>
              <p className="mb-6 text-lg text-brand-slate">
                {start.long}
                {end ? ` — ${end.long}` : ''} · {ev.venueName}
              </p>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element -- Payload rendition
                <img src={img} alt={mediaAlt(ev.image, ev.title)} className="mb-6 block h-auto w-full rounded-lg" />
              ) : null}
              {ev.description ? <RichText data={ev.description} /> : ev.summary ? <p>{ev.summary}</p> : null}
            </article>
            <aside className="grid gap-[var(--grid-gap)]">
              <div className="widget">
                <div className="widget-head">When &amp; where</div>
                <div className="widget-body">
                  <dl className="m-0 grid gap-3 text-sm">
                    <div>
                      <dt className="font-semibold text-brand-slate">Starts</dt>
                      <dd className="m-0">{start.long}</dd>
                    </div>
                    {end ? (
                      <div>
                        <dt className="font-semibold text-brand-slate">Ends</dt>
                        <dd className="m-0">{end.long}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="font-semibold text-brand-slate">Venue</dt>
                      <dd className="m-0">
                        {ev.venueName}
                        {ev.address ? <div>{ev.address}</div> : null}
                      </dd>
                    </div>
                    {price ? (
                      <div>
                        <dt className="font-semibold text-brand-slate">Price</dt>
                        <dd className="m-0">{price}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {ev.ticketUrl ? (
                    <a href={ev.ticketUrl} target="_blank" rel="noopener" className="btn btn-block mt-4">
                      {ev.isFree ? 'Event details' : 'Get tickets'}
                    </a>
                  ) : null}
                </div>
              </div>
              {ev.lat != null && ev.lng != null ? (
                <MapClient height={240} points={[{ id: String(ev.id), lat: ev.lat, lng: ev.lng, title: ev.venueName, subtitle: ev.address ?? undefined, kind: 'premium' }]} />
              ) : null}
              <AdSlot code="EVENTS_SIDEBAR_1" size="300x250" mobileSize="320x100" />
            </aside>
          </div>
        </div>
      </section>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: ev.title,
          startDate: ev.startAt,
          ...(ev.endAt ? { endDate: ev.endAt } : {}),
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: ev.venueName,
            address: {
              '@type': 'PostalAddress',
              ...(ev.address ? { streetAddress: ev.address } : {}),
              addressLocality: 'Seattle',
              addressRegion: 'WA',
              addressCountry: 'US',
            },
            ...(ev.lat != null && ev.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: ev.lat, longitude: ev.lng } } : {}),
          },
          ...(img ? { image: [absoluteUrl(img)] } : {}),
          ...(ev.summary ? { description: ev.summary } : {}),
          offers: {
            '@type': 'Offer',
            url: ev.ticketUrl || absoluteUrl(`/events/${ev.slug}`),
            ...(ev.isFree ? { price: 0 } : ev.price && /\d/.test(ev.price) ? { price: Number(ev.price.replace(/[^\d.]/g, '').split('.')[0]) || undefined } : {}),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          organizer: { '@type': 'Organization', name: ev.venueName },
        }}
      />
    </main>
  )
}
