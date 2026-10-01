import Link from 'next/link'

import { clockText } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getHeader } from '@/lib/queries'
import { getCurrentWeather } from '@/lib/weather'

import { SearchBox } from './SearchBox'
import { SeattleClock } from './SeattleClock'
import { Svg, WEATHER_ICONS } from './icons'

const DEFAULT_PHOTO = '/brand/skyline-panorama.webp'
const MOBILE_PHOTO = '/brand/skyline-panorama-mobile.webp'
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
          {/* Phones show only the middle of the panorama (object-fit: cover in a
              200–230px frame), so they get a pre-cropped 686x400 copy of the
              built-in photo — a third of the bytes of the LCP image. A photo
              set in the admin has no such crop and is served as is. */}
          <picture>
            {header.heroImage ? null : <source media="(max-width: 767px)" srcSet={MOBILE_PHOTO} />}
            <img src={photo} alt={alt} className="hero-photo" fetchPriority="high" />
          </picture>
          <div className="hero-shade" />
          <Link className="hero-weather" href="/weather">
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
