import type { Metadata } from 'next'
import Link from 'next/link'

import { getSiteStats } from '@/lib/queries-phase3'
import { type AdvertiserStats, getAdvertiserStats } from '@/lib/stats'

// /advertise/stats — the numbers a business can check before it buys a place (counters block,
// 22.11.2026): page views, price requests and banner impressions and clicks for the last 30 days
// and since counting began, plus what is live on the site now. Our own counters, not Google
// Analytics (which loads only after a visitor accepts cookies). Aggregates only: no person and
// no named business. Cached for an hour.

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AllSeattle in numbers',
  description: 'Page views, price requests and banner results on AllSeattle — the numbers behind an advertising place.',
  alternates: { canonical: '/advertise/stats' },
}

const n = (v: number) => v.toLocaleString('en-US')
const ctr = (clicks: number, impressions: number) => (impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : '—')
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function Tiles({ title, tiles }: { title: string; tiles: [string, string][] }) {
  return (
    <div className="widget">
      <div className="widget-head">{title}</div>
      <div className="widget-body">
        <div className="stat-grid">
          {tiles.map(([label, value]) => (
            <div key={label} className="stat-tile">
              <span className="num">{value}</span>
              <span className="label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const period = (s: AdvertiserStats['last30']): [string, string][] => [
  ['Site page views', n(s.siteViews)],
  ['Business page views', n(s.businessViews)],
  ['Price requests sent', n(s.requests)],
  ['Banner impressions', n(s.impressions)],
  ['Banner clicks', n(s.clicks)],
  ['Banner click rate', ctr(s.clicks, s.impressions)],
]

export default async function AdvertiseStatsPage() {
  const [stats, live] = await Promise.all([getAdvertiserStats(), getSiteStats()])
  return (
    <main id="content" data-page="advertise-stats">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Advertise on AllSeattle</span>
              <h1>AllSeattle in numbers</h1>
            </div>
          </div>
          <p className="muted">
            {stats.since ? `Counting since ${day(stats.since)}.` : 'Counting has just started.'} These are our own counters, updated
            every hour. A business page view is counted once per visitor session; a price request is a message a visitor sent to a
            business through its page.
          </p>

          <div className="grid gap-[var(--grid-gap)] lg:grid-cols-3">
            <Tiles title="Last 30 days" tiles={period(stats.last30)} />
            <Tiles title="Since counting began" tiles={period(stats.total)} />
            <Tiles
              title="On the site now"
              tiles={[
                ['Businesses', n(live.businesses.total)],
                ['Cars for sale', n(live.cars.total)],
                ['Job openings', n(live.jobs.total)],
              ]}
            />
          </div>

          <p className="muted mt-6">
            Want a place for your business?{' '}
            <Link href="/advertise" className="text-brand-navy underline">
              See packages and banner prices
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
