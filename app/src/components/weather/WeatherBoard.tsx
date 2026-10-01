'use client'

import { useEffect, useState } from 'react'

import type { Forecast } from '@/lib/forecast'

import { WEATHER_ICONS } from '../icons'

// The prototype's weather dashboard (weather.html + js/pages/weather.js, css:
// styles/weather.css) on live Open-Meteo data. Opens on Today (hourly) — the
// client's request in the prototype. Tab and units live only in the page.

const icon = (name: string, size: number) => (WEATHER_ICONS[name] ?? WEATHER_ICONS.cloud)(size)
const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
)

const uvWord = (v: number) => (v <= 2 ? 'Low' : v <= 5 ? 'Moderate' : v <= 7 ? 'High' : 'Very high')
const humidityWord = (v: number) => (v < 30 ? 'Dry' : v <= 60 ? 'Normal' : 'High')
const visibilityWord = (mi: number) => (mi >= 6 ? 'Good' : mi >= 2 ? 'Average' : 'Poor')
const aqiWord = (v: number) => (v <= 50 ? 'Good' : v <= 100 ? 'Moderate' : v <= 150 ? 'Unhealthy for some' : 'Unhealthy')

function UvGauge({ uv }: { uv: number }) {
  const max = 12
  const pct = Math.min(uv / max, 1) * 100
  return (
    <svg className="wx-gauge" viewBox="-12 -8 224 124" role="img" aria-label={`UV index ${uv} of ${max}`}>
      <path d="M22 104 A78 78 0 0 1 178 104" pathLength={100} className="wx-gauge-track" />
      <path d="M22 104 A78 78 0 0 1 178 104" pathLength={100} className="wx-gauge-fill" strokeDasharray={`${pct.toFixed(1)} 100`} />
      {[0, 3, 6, 9, 12].map((v) => {
        const a = Math.PI - (v / max) * Math.PI
        return (
          <text key={v} x={(100 + Math.cos(a) * 98).toFixed(1)} y={(104 - Math.sin(a) * 98).toFixed(1)} className="wx-gauge-tick">
            {v}
          </text>
        )
      })}
      <text x="100" y="100" className="wx-gauge-value">
        {uv}
      </text>
    </svg>
  )
}

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const p = Math.max(0, Math.min(value / max, 1))
  return (
    <span className="wx-meter" role="img" aria-label={label}>
      <span className="wx-meter-dot" style={{ ['--p' as string]: p.toFixed(2) }} />
    </span>
  )
}

export function WeatherBoard({ data, placePhoto }: { data: Forecast; placePhoto: string }) {
  const [view, setView] = useState<'today' | 'week'>('today')
  const [unit, setUnit] = useState<'f' | 'c'>('f')
  const [clock, setClock] = useState<{ day: string; time: string } | null>(null)
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock({
        day: d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' }),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }),
      })
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const t = (f: number) => (unit === 'c' ? Math.round(((f - 32) * 5) / 9) : f)
  const w = data.now

  return (
    <>
      <div className="wx-board">
        <div className="wx-now">
          <Svg className="wx-now-icon" html={icon(w.icon, 112)} />
          <div className="wx-now-temp">
            {t(w.tempF)}
            <span>&deg;{unit.toUpperCase()}</span>
          </div>
          <div className="wx-now-time" suppressHydrationWarning>
            {clock ? (
              <>
                {clock.day}, <span>{clock.time}</span>
              </>
            ) : (
              'Seattle'
            )}
          </div>
          <ul className="wx-now-facts">
            <li>
              <Svg className="wx-fact-icon" html={icon(w.icon, 20)} />
              {w.condition}
            </li>
            <li>
              <Svg className="wx-fact-icon" html={icon('rain', 20)} />
              Rain &ndash; {w.rainChance}%
            </li>
          </ul>
          <div className="wx-place">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative city photo */}
            <img src={placePhoto} alt="" loading="lazy" />
            <span>Seattle, WA, USA</span>
          </div>
        </div>

        <div className="wx-main">
          <div className="wx-toolbar">
            <div className="wx-tabs" role="tablist" aria-label="Forecast range">
              {(['today', 'week'] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={view === v} className={`wx-tab${view === v ? ' is-active' : ''}`} onClick={() => setView(v)}>
                  {v === 'today' ? 'Today' : 'Week'}
                </button>
              ))}
            </div>
            <div className="wx-units" role="group" aria-label="Temperature unit">
              {(['c', 'f'] as const).map((u) => (
                <button key={u} type="button" aria-pressed={unit === u} className={`wx-unit${unit === u ? ' is-active' : ''}`} onClick={() => setUnit(u)}>
                  &deg;{u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`wx-strip wx-strip--${view === 'week' ? 'days' : 'hours'}`}>
            {view === 'week'
              ? data.days.map((d) => (
                  <div key={d.label} className="wx-slot" title={`${d.condition}, ${d.pop}% chance of rain`}>
                    <span className="wx-slot-label">{d.label}</span>
                    <Svg className="wx-slot-icon" html={icon(d.icon, 24)} />
                    <span className="wx-slot-temp">
                      {t(d.hiF)}&deg; <span className="lo">{t(d.loF)}&deg;</span>
                    </span>
                  </div>
                ))
              : data.hours.map((h) => (
                  <div key={h.label} className="wx-slot" title={`${h.pop}% chance of rain`}>
                    <span className="wx-slot-label">{h.label}</span>
                    <Svg className="wx-slot-icon" html={icon(h.icon, 24)} />
                    <span className="wx-slot-temp">{t(h.tempF)}&deg;</span>
                  </div>
                ))}
          </div>

          <h2 className="wx-h">Today&rsquo;s highlights</h2>
          <div className="wx-highlights">
            <div className="wx-card">
              <span className="wx-card-title">UV index</span>
              <UvGauge uv={w.uvIndex} />
              <span className="wx-card-note">{uvWord(w.uvIndex)}</span>
            </div>
            <div className="wx-card">
              <span className="wx-card-title">Wind status</span>
              <span className="wx-big">
                {w.windMph}
                <small>mph</small>
              </span>
              <span className="wx-card-note wx-with-icon">
                <Svg className="wx-round-icon" html={icon('compass', 20)} />
                {w.windDir}
              </span>
            </div>
            <div className="wx-card">
              <span className="wx-card-title">Sunrise &amp; sunset</span>
              <div className="wx-sun-row">
                <Svg className="wx-round-icon" html={icon('sunrise', 20)} />
                <span>
                  <b>{w.sunrise}</b>
                  <span className="wx-shift">{w.sunriseShift}</span>
                </span>
              </div>
              <div className="wx-sun-row">
                <Svg className="wx-round-icon" html={icon('sunset', 20)} />
                <span>
                  <b>{w.sunset}</b>
                  <span className="wx-shift">{w.sunsetShift}</span>
                </span>
              </div>
            </div>
            <div className="wx-card">
              <span className="wx-card-title">Humidity</span>
              <div className="wx-with-meter">
                <span className="wx-big">
                  {w.humidity}
                  <small>%</small>
                </span>
                <Meter value={w.humidity} max={100} label={`Humidity ${w.humidity}%`} />
              </div>
              <span className="wx-card-note">{humidityWord(w.humidity)}</span>
            </div>
            <div className="wx-card">
              <span className="wx-card-title">Visibility</span>
              <span className="wx-big">
                {w.visibilityMi}
                <small>mi</small>
              </span>
              <span className="wx-card-note">{visibilityWord(w.visibilityMi)}</span>
            </div>
            {w.aqi != null ? (
              <div className="wx-card">
                <span className="wx-card-title">Air quality</span>
                <div className="wx-with-meter">
                  <span className="wx-big">{w.aqi}</span>
                  <Meter value={w.aqi} max={200} label={`Air quality index ${w.aqi}`} />
                </div>
                <span className="wx-card-note">{aqiWord(w.aqi)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {data.region.length ? (
        <>
          <h2 className="weather-h">Around the region</h2>
          <div className="weather-region">
            {data.region.map((r) => (
              <div key={r.city} className="weather-region-row">
                <span className="weather-region-city">{r.city}</span>
                <span className="weather-region-cond">
                  <Svg className="weather-icon-sm" html={icon(r.icon, 20)} />
                  <span>{r.condition}</span>
                </span>
                <span className="weather-region-temp">{t(r.tempF)}&deg;</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
