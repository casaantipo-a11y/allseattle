import { describeCode } from './weather'

// Everything the /weather page shows, from Open-Meteo (no key): current
// conditions, the next 12 hours, 7 days, US AQI, and the region's towns in one
// request. Cached 30 minutes, like the header plate. Any failed part comes
// back null and the page simply leaves that part out.

const SEATTLE = { lat: 47.6062, lon: -122.3321 }
const REGION = [
  { city: 'Bellevue', lat: 47.6101, lon: -122.2015 },
  { city: 'Tacoma', lat: 47.2529, lon: -122.4443 },
  { city: 'Everett', lat: 47.979, lon: -122.2021 },
  { city: 'Olympia', lat: 47.0379, lon: -122.9007 },
  { city: 'Bremerton', lat: 47.5673, lon: -122.6326 },
  { city: 'Snoqualmie Pass', lat: 47.4241, lon: -121.4135 },
]

export type Icon = 'sun' | 'cloud' | 'cloud-sun' | 'rain' | 'snow'
export type Forecast = {
  now: {
    tempF: number
    condition: string
    icon: Icon
    humidity: number
    windMph: number
    windDir: string
    visibilityMi: number
    uvIndex: number
    sunrise: string
    sunset: string
    sunriseShift: string
    sunsetShift: string
    aqi: number | null
    rainChance: number
  }
  hours: { label: string; tempF: number; icon: Icon; pop: number }[]
  days: { label: string; hiF: number; loF: number; icon: Icon; condition: string; pop: number }[]
  region: { city: string; tempF: number; condition: string; icon: Icon }[]
}

const get = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { next: { revalidate: 1800, tags: ['weather'] } })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

const compass = (deg: number) => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(deg / 22.5) % 16]
const clock = (iso: string) => {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
const minutesOf = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))
const shift = (today: string, tomorrow?: string) => {
  if (!tomorrow) return ''
  const d = minutesOf(tomorrow) - minutesOf(today)
  return d === 0 ? 'same tomorrow' : `${d > 0 ? '+' : '−'}${Math.abs(d)} min tomorrow`
}

type Main = {
  current: { temperature_2m: number; weather_code: number; is_day: number; relative_humidity_2m: number; wind_speed_10m: number; wind_direction_10m: number; visibility: number }
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[] }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
  }
}

export async function getForecast(): Promise<Forecast | null> {
  const base = `latitude=${SEATTLE.lat}&longitude=${SEATTLE.lon}`
  const [main, air, region] = await Promise.all([
    get<Main>(
      `https://api.open-meteo.com/v1/forecast?${base}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,visibility` +
        '&hourly=temperature_2m,weather_code,precipitation_probability&forecast_hours=12' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&forecast_days=8' +
        '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FLos_Angeles',
    ),
    get<{ current?: { us_aqi?: number } }>(`https://air-quality-api.open-meteo.com/v1/air-quality?${base}&current=us_aqi`),
    get<{ current: { temperature_2m: number; weather_code: number } }[]>(
      `https://api.open-meteo.com/v1/forecast?latitude=${REGION.map((r) => r.lat).join(',')}&longitude=${REGION.map((r) => r.lon).join(',')}` +
        '&current=temperature_2m,weather_code&temperature_unit=fahrenheit',
    ),
  ])
  if (!main) return null
  const c = main.current
  const d = main.daily
  const nowDesc = describeCode(c.weather_code, Boolean(c.is_day))
  const weekday = (iso: string, i: number) =>
    i === 0 ? 'Today' : new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })

  return {
    now: {
      tempF: Math.round(c.temperature_2m),
      condition: nowDesc.description,
      icon: nowDesc.icon,
      humidity: Math.round(c.relative_humidity_2m),
      windMph: Math.round(c.wind_speed_10m),
      windDir: compass(c.wind_direction_10m),
      visibilityMi: Math.round((c.visibility / 1609.34) * 10) / 10,
      uvIndex: Math.round(d.uv_index_max[0] ?? 0),
      sunrise: clock(d.sunrise[0]),
      sunset: clock(d.sunset[0]),
      sunriseShift: shift(d.sunrise[0], d.sunrise[1]),
      sunsetShift: shift(d.sunset[0], d.sunset[1]),
      aqi: air?.current?.us_aqi != null ? Math.round(air.current.us_aqi) : null,
      rainChance: d.precipitation_probability_max[0] ?? 0,
    },
    hours: main.hourly.time.map((t, i) => ({
      label: i === 0 ? 'Now' : clock(t).replace(':00', ''),
      tempF: Math.round(main.hourly.temperature_2m[i]),
      icon: describeCode(main.hourly.weather_code[i], true).icon,
      pop: main.hourly.precipitation_probability[i] ?? 0,
    })),
    days: d.time.slice(0, 7).map((t, i) => ({
      label: weekday(t, i),
      hiF: Math.round(d.temperature_2m_max[i]),
      loF: Math.round(d.temperature_2m_min[i]),
      icon: describeCode(d.weather_code[i], true).icon,
      condition: describeCode(d.weather_code[i], true).description,
      pop: d.precipitation_probability_max[i] ?? 0,
    })),
    region: (region ?? []).map((r, i) => ({
      city: REGION[i].city,
      tempF: Math.round(r.current.temperature_2m),
      ...(({ description, icon }) => ({ condition: description, icon }))(describeCode(r.current.weather_code, true)),
    })),
  }
}
