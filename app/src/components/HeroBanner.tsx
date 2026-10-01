import Link from 'next/link'

import { clockText } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getHeader } from '@/lib/queries'
import { getCurrentWeather } from '@/lib/weather'

import { SearchBox } from './SearchBox'
import { SeattleClock } from './SeattleClock'
import { Svg, WEATHER_ICONS } from './icons'

const DEFAULT_PHOTO = '/brand/skyline-panorama.webp'
const DEFAULT_ALT = 'Seattle skyline with the Space Needle, Mount Rainier and Pike Place Market'

// The panorama under the header, as in the prototype (css: header.css):
// weather plate bottom-left — city, Seattle date and time, live temperature
// and conditions — and the search box. The photo is the Header global's
// heroImage, or the built-in skyline.
export async function HeroBanner() {
  const [header, weather] = await Promise.all([getHeader(), getCurrentWeather()])
  const photo = mediaUrl(header.heroImage, 'hero') ?? DEFAULT_PHOTO
  const alt = header.heroImage ? mediaAlt(header.heroImage, DEFAULT_ALT) : DEFAULT_ALT
  const icon = WEATHER_ICONS[weather?.icon ?? 'cloud']

  return (
    <div className="hero-banner" id="hero-banner">
      <div className="container">
        <div className="hero-frame">
          {/* eslint-disable-next-line @next/next/no-img-element -- LCP image, CSS-cropped; next/image would add a wrapper the prototype CSS doesn't expect */}
          <img src={photo} alt={alt} className="hero-photo" fetchPriority="high" />
          <div className="hero-shade" />
          <Link className="hero-weather" href="/weather" aria-label="Seattle weather">
            <Svg className="weather-icon" html={icon(24)} />
            <span className="weather-text">
              <strong>Seattle, WA</strong>
              <span>
                <SeattleClock initial={clockText()} />
                {weather ? <> &middot; {weather.tempF}&deg;F</> : null}
              </span>
              {weather ? <span className="weather-note">{weather.description}</span> : null}
            </span>
          </Link>
          <SearchBox />
        </div>
      </div>
    </div>
  )
}
