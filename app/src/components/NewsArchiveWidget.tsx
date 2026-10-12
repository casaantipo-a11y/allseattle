'use client'

import { useRouter } from 'next/navigation'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// The News sidebar's "News Archive", back from the prototype (client,
// 12.10.2026): Month and Year selects built from the months that actually have
// stories. Choosing one opens the feed filtered to it — ?month=&year= on the
// current list (/news or a category), so every archive view has its own URL.
export function NewsArchiveWidget({
  months,
  month,
  year,
  base,
}: {
  months: { year: number; month: number }[]
  month?: number
  year?: number
  base: string
}) {
  const router = useRouter()
  const monthOptions = [...new Set(months.map((m) => m.month))].sort((a, b) => a - b)
  const yearOptions = [...new Set(months.map((m) => m.year))].sort((a, b) => b - a)

  const go = (m: string, y: string) => {
    const qs = new URLSearchParams({ ...(m ? { month: m } : {}), ...(y ? { year: y } : {}) }).toString()
    router.push(qs ? `${base}?${qs}` : base)
  }

  return (
    <div className="widget">
      <div className="widget-head">News Archive</div>
      <div className="widget-body">
        <div className="news-archive-row">
          <div className="field">
            <label htmlFor="ar-month">Month</label>
            <select id="ar-month" value={month ?? ''} onChange={(e) => go(e.target.value, year ? String(year) : '')}>
              <option value="">All</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {MONTHS[m - 1]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ar-year">Year</label>
            <select id="ar-year" value={year ?? ''} onChange={(e) => go(month ? String(month) : '', e.target.value)}>
              <option value="">All</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
