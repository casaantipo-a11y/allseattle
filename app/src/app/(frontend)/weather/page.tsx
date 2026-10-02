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
      <section className="section">
        <div className="container">
          <AdSlot code="WEATHER_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <div className="section-head section-head--sub section-head--nudge section-head--btn-lower">
            <div>
              <span className="eyebrow">Seattle forecast</span>
              <h1>Weather</h1>
            </div>
            <Link href="/advertise" className="btn">
              Place an ad
            </Link>
          </div>
          {data ? (
            <WeatherBoard data={data} placePhoto="/brand/downtown.webp" />
          ) : (
            <p className="muted">The forecast service isn&rsquo;t answering right now. Please try again in a few minutes.</p>
          )}
        </div>
      </section>
    </main>
  )
}
