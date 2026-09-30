// Current Seattle weather from Open-Meteo (no API key). Cached for 30 minutes
// by Next's fetch cache, so the header costs one upstream request per half
// hour no matter how many visitors there are. A failed request returns null
// and the header simply shows the date without the weather.

const SEATTLE = { lat: 47.6062, lon: -122.3321 }

export type CurrentWeather = {
  tempF: number
  description: string
  icon: 'sun' | 'cloud' | 'cloud-sun' | 'rain' | 'snow'
  isDay: boolean
}

// WMO weather interpretation codes → words and one of our five icons.
function describe(code: number): Pick<CurrentWeather, 'description' | 'icon'> {
  if (code === 0) return { description: 'Clear sky', icon: 'sun' }
  if (code === 1) return { description: 'Mostly clear', icon: 'cloud-sun' }
  if (code === 2) return { description: 'Partly cloudy', icon: 'cloud-sun' }
  if (code === 3) return { description: 'Cloudy', icon: 'cloud' }
  if (code === 45 || code === 48) return { description: 'Fog', icon: 'cloud' }
  if (code >= 51 && code <= 57) return { description: 'Drizzle', icon: 'rain' }
  if (code >= 61 && code <= 67) return { description: 'Rain', icon: 'rain' }
  if (code >= 71 && code <= 77) return { description: 'Snow', icon: 'snow' }
  if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: 'rain' }
  if (code === 85 || code === 86) return { description: 'Snow showers', icon: 'snow' }
  if (code >= 95) return { description: 'Thunderstorm', icon: 'rain' }
  return { description: 'Cloudy', icon: 'cloud' }
}

export async function getCurrentWeather(): Promise<CurrentWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SEATTLE.lat}&longitude=${SEATTLE.lon}` +
    '&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles'
  try {
    const res = await fetch(url, { next: { revalidate: 1800, tags: ['weather'] } })
    if (!res.ok) return null
    const data = (await res.json()) as {
      current?: { temperature_2m: number; weather_code: number; is_day: number }
    }
    if (!data.current) return null
    const { temperature_2m, weather_code, is_day } = data.current
    const d = describe(weather_code)
    // Clear or mostly clear at night reads wrong with a sun; use the cloud.
    const icon = !is_day && (d.icon === 'sun' || d.icon === 'cloud-sun') ? 'cloud' : d.icon
    return { tempF: Math.round(temperature_2m), description: d.description, icon, isDay: Boolean(is_day) }
  } catch {
    return null
  }
}
