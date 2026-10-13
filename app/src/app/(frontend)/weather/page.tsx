import type { Metadata } from 'next'
import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { WeatherBoard } from '@/components/weather/WeatherBoard'
import { getForecast } from '@/lib/forecast'

// Weather changes faster than content; the forecast itself is cached 30 min.
export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Seattle weather — today and 7-day forecast',
  description: 'Seattle weather now, hour by hour for today and the 7-day forecast, with UV, wind, humidity, air quality and nearby towns.',
  alternates: { canonical: '/weather' },
}

export default async function WeatherPage() {
  const data = await getForecast()
  return (
    <main id="content" data-page="weather">
      <section className="section section--footer-tight">
        <div className="container">
          <AdSlot code="WEATHER_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top ad-slot-top--in-head" />
          <div className="section-head section-head--sub section-head--nudge section-head--btn-down">
            <div>
              <span className="eyebrow">Seattle forecast</span>
              <h1>Weather</h1>
            </div>
            {/* Same card as Jobs' "Post a job" (client, 04.10.2026). */}
            <Link href="/advertise" className="post-card">
              <span className="post-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
                  <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
                </svg>
              </span>
              <span className="post-card-text">
                <span className="post-card-kicker">Have a business?</span>
                <span className="post-card-title">Place an ad</span>
              </span>
              <span className="post-card-go" aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {data ? (
            <WeatherBoard data={data} placePhoto="/brand/downtown.webp" />
          ) : (
            <p className="muted">The forecast service isn&rsquo;t answering right now. Please try again in a few minutes.</p>
          )}
          {/* B2 under the main content ("other sections" scheme, 12.10.2026). */}
          <AdSlot code="WEATHER_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
        </div>
      </section>
    </main>
  )
}
