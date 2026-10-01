'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

// "Report" tab of a banner in the admin (spec §7): impressions, clicks and
// CTR for a chosen period, per day, plus the CSV for the advertiser. Data
// comes from /api/banners/report/{id}; the admin session cookie authorises it.

type Report = {
  from: string
  to: string
  days: { date: string; impressions: number; clicks: number; ctr: number }[]
  total: { impressions: number; clicks: number; ctr: number }
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
  })
const fmt = (n: number) => n.toLocaleString('en-US')

const cell = {
  padding: '6px 12px',
  borderBottom: '1px solid var(--theme-elevation-100)',
  textAlign: 'right' as const,
}
const head = { ...cell, fontWeight: 600, color: 'var(--theme-elevation-600)' }

export function BannerReport() {
  const { id } = useDocumentInfo()
  const [from, setFrom] = useState(daysAgo(29))
  const [to, setTo] = useState(today())
  const [data, setData] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const res = await fetch(`/api/banners/report/${id}?from=${from}&to=${to}`, {
        credentials: 'include',
      })
      if (!res.ok)
        throw new Error(
          res.status === 403 ? 'Only admin and sales can see reports.' : `Error ${res.status}`,
        )
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the report')
    }
  }, [id, from, to])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on open and when the period changes
    void load()
  }, [load])

  if (!id)
    return (
      <p style={{ color: 'var(--theme-elevation-500)' }}>
        Save the banner first — the report appears once it exists.
      </p>
    )

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          From
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          To
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <a
          className="btn btn--style-secondary btn--size-small"
          href={`/api/banners/report/${id}?from=${from}&to=${to}&format=csv`}
          style={{ margin: 0 }}
        >
          Export CSV
        </a>
      </div>

      {error ? <p style={{ color: 'var(--theme-error-500)' }}>{error}</p> : null}

      {data ? (
        <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['Impressions', fmt(data.total.impressions)],
              ['Clicks', fmt(data.total.clicks)],
              ['CTR', `${data.total.ctr}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--theme-elevation-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          {data.days.length ? (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...head, textAlign: 'left' }}>Date</th>
                  <th style={head}>Impressions</th>
                  <th style={head}>Clicks</th>
                  <th style={head}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.days.map((d) => (
                  <tr key={d.date}>
                    <td style={{ ...cell, textAlign: 'left' }}>{d.date}</td>
                    <td style={cell}>{fmt(d.impressions)}</td>
                    <td style={cell}>{fmt(d.clicks)}</td>
                    <td style={cell}>{d.ctr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--theme-elevation-500)' }}>
              No impressions or clicks in this period yet.
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}
