import Link from 'next/link'

import { EventCard } from '@/components/events'
import { fmtMileage, fmtPrice, toCarItem } from '@/lib/cars'
import { toJobItem } from '@/lib/jobs'
import type { CarListing, Event, Job } from '@/payload-types'

// Home page blocks from spec §3, built from the prototype's components
// (widgets, stat tiles, mini rows, event and car cards, the contest strip).

type Stat = { total: number; today: number }

export function StatsWidget({ stats }: { stats: { businesses: Stat; cars: Stat; jobs: Stat; events: Stat } }) {
  const tiles: [string, Stat, string][] = [
    ['Businesses', stats.businesses, '/directory'],
    ['Cars for sale', stats.cars, '/cars'],
    ['Job openings', stats.jobs, '/jobs'],
    ['Events', stats.events, '/events'],
  ]
  return (
    <div className="widget">
      <div className="widget-head">AllSeattle at a glance</div>
      <div className="widget-body">
        <div className="stat-grid">
          {tiles.map(([label, s, href]) => (
            <Link key={label} href={href} className="stat-tile no-underline">
              <span className="num">{s.total.toLocaleString('en-US')}</span>
              <span className="label">
                {label}
                {s.today ? <span className="block text-brand-red">+{s.today} today</span> : null}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function JobsWidget({ jobs }: { jobs: Job[] }) {
  const latest = jobs.slice(0, 3).map(toJobItem)
  return (
    <div className="widget">
      <div className="widget-head">Job board</div>
      <div className="widget-body job-mini">
        <ul className="job-mini-list">
          {latest.map((j) => (
            <li key={j.id}>
              <Link className="job-mini-row" href={`/jobs/${j.slug}`}>
                <span className="job-mini-main">
                  <span className="job-mini-title">{j.title}</span>
                  <span className="job-mini-company">{j.company}</span>
                </span>
                {j.salary || j.type ? <span className="job-mini-pay">{j.salary || j.type}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/jobs" className="job-mini-all">
          All jobs &rarr;
        </Link>
      </div>
    </div>
  )
}

export function UpcomingEvents({ events }: { events: Event[] }) {
  if (!events.length) return null
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">What is on</span>
            <h2>Coming up in Seattle</h2>
          </div>
          <Link href="/events" className="btn btn-outline btn-sm">
            All events
          </Link>
        </div>
        <div className="grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {events.slice(0, 4).map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function FreshCars({ cars }: { cars: CarListing[] }) {
  if (!cars.length) return null
  const items = cars.slice(0, 4).map(toCarItem)
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">AllSeattle Auto</span>
            <h2>Fresh cars</h2>
          </div>
          <Link href="/cars" className="btn btn-outline btn-sm">
            All cars
          </Link>
        </div>
        <div className="grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((c) => (
            <Link key={c.id} href={`/cars/${c.slug}`} className="card car-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- card rendition */}
              <div className="car-card-photo">{c.photo ? <img src={c.photo} alt={c.title} loading="lazy" /> : null}</div>
              <div className="car-card-body">
                <div className="car-card-price">{fmtPrice(c.price)}</div>
                <div className="car-card-title">{c.title}</div>
                <div className="car-card-specs">
                  <span>{fmtMileage(c.mileage)}</span>
                  <span>&middot;</span>
                  <span>{c.transmission}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
