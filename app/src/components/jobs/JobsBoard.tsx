'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

// The prototype's job board (jobs.html + js/pages/jobs.js, css: styles/jobs.css)
// on real data: the work.ua-style filter column with counters, sort, and dense
// cards. Within a group options add up ("or"), between groups they narrow
// ("and"); an option's counter is computed as if only its own group were
// unset, so ticking one employment type doesn't zero out the others. Titles
// now link to each job's own page.

export type JobItem = {
  id: number
  slug: string
  title: string
  company: string
  companyHref?: string | null
  category: string
  type: string
  salary: string
  annual: number | null
  location?: string | null
  workMode: string
  openTo: string[]
  perks: string[]
  languages: string[]
  urgent: boolean
  featured: boolean
  postedAt: string
  summary?: string | null
}

const OPEN_TO: [string, string][] = [
  ['noExperience', 'No experience needed'],
  ['students', 'Students welcome'],
  ['accessible', 'Accessible workplace'],
  ['fiftyPlus', '50+ welcome'],
]
const OPEN_TO_LABEL = Object.fromEntries(OPEN_TO)
const POSTED: [string, string][] = [
  ['1', 'Last 24 hours'],
  ['3', 'Last 3 days'],
  ['7', 'Last week'],
]
const WORK_MODE_LABEL: Record<string, string> = { 'on-site': 'On-site', hybrid: 'Hybrid', remote: 'Remote' }

type Groups = 'types' | 'workModes' | 'openTo' | 'perks' | 'languages'
type State = {
  query: string
  category: string
  types: string[]
  workModes: string[]
  openTo: string[]
  perks: string[]
  languages: string[]
  salaryMin: number | null
  salaryMax: number | null
  posted: string
  sort: string
}
const EMPTY: State = {
  query: '',
  category: 'All',
  types: [],
  workModes: [],
  openTo: [],
  perks: [],
  languages: [],
  salaryMin: null,
  salaryMax: null,
  posted: '',
  sort: 'newest',
}

const daysAgo = (j: JobItem) => (Date.now() - new Date(j.postedAt).getTime()) / 86400000
const monogram = (s: string) =>
  s
    .replace(/[^A-Za-z ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
function relative(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000
  if (h < 1) return 'Just now'
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
}

const Check = () => (
  <svg className="job-check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
const Pin = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

const SORTS = [
  ['newest', 'Newest'],
  ['salary-desc', 'Highest pay'],
  ['salary-asc', 'Lowest pay'],
  ['company', 'Company A–Z'],
] as const

export function JobsBoard({ jobs, initialQuery = '' }: { jobs: JobItem[]; initialQuery?: string }) {
  const [s, setS] = useState<State>({ ...EMPTY, query: initialQuery })
  const [open, setOpen] = useState(false)
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }))

  const matches = (j: JobItem, skip = '') => {
    if (s.query) {
      const hay = [j.title, j.company, j.category, j.location, j.summary].join(' ').toLowerCase()
      if (!hay.includes(s.query.toLowerCase())) return false
    }
    if (skip !== 'category' && s.category !== 'All' && j.category !== s.category) return false
    if (skip !== 'types' && s.types.length && !s.types.includes(j.type)) return false
    if (skip !== 'workModes' && s.workModes.length && !s.workModes.includes(j.workMode)) return false
    if (skip !== 'openTo' && s.openTo.length && !s.openTo.some((k) => j.openTo.includes(k))) return false
    if (skip !== 'perks' && s.perks.length && !s.perks.some((k) => j.perks.includes(k))) return false
    if (skip !== 'languages' && s.languages.length && !s.languages.some((k) => j.languages.includes(k))) return false
    if (s.salaryMin && (j.annual ?? 0) < s.salaryMin) return false
    if (s.salaryMax && (j.annual ?? Infinity) > s.salaryMax) return false
    if (skip !== 'posted' && s.posted && daysAgo(j) > Number(s.posted)) return false
    return true
  }
  const count = (group: string, test: (j: JobItem) => boolean) => jobs.filter((j) => matches(j, group) && test(j)).length

  const found = useMemo(() => {
    const list = jobs.filter((j) => matches(j))
    const by: Record<string, (a: JobItem, b: JobItem) => number> = {
      'salary-desc': (a, b) => (b.annual ?? 0) - (a.annual ?? 0),
      'salary-asc': (a, b) => (a.annual ?? 0) - (b.annual ?? 0),
      company: (a, b) => a.company.localeCompare(b.company),
      newest: (a, b) => Number(b.featured) - Number(a.featured) || +new Date(b.postedAt) - +new Date(a.postedAt),
    }
    return [...list].sort(by[s.sort] ?? by.newest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, s])

  const uniq = (xs: string[]) => [...new Set(xs)].sort()
  const categories = uniq(jobs.map((j) => j.category))
  const salarySteps = useMemo(() => {
    const all = jobs.map((j) => j.annual).filter((x): x is number => x != null)
    if (!all.length) return []
    // $10k steps, widened so the list never passes ~30 options whatever the data.
    const span = Math.max(...all) - Math.min(...all)
    const step = Math.max(10000, Math.ceil(span / 30 / 10000) * 10000)
    const lo = Math.floor(Math.min(...all) / step) * step
    const hi = Math.ceil(Math.max(...all) / step) * step
    const out: number[] = []
    for (let v = lo; v <= hi; v += step) out.push(v)
    return out
  }, [jobs])

  const toggle = (group: Groups, value: string, on: boolean) =>
    set({ [group]: on ? [...s[group], value] : s[group].filter((v) => v !== value) } as Partial<State>)

  const checkGroup = (title: string, group: Groups | 'posted', options: [string, string][]) => {
    const rows = options
      .map(([value, label]) => ({
        value,
        label,
        n: count(group, (j) => {
          if (group === 'types') return j.type === value
          if (group === 'workModes') return j.workMode === value
          if (group === 'openTo') return j.openTo.includes(value)
          if (group === 'perks') return j.perks.includes(value)
          if (group === 'languages') return j.languages.includes(value)
          return daysAgo(j) <= Number(value)
        }),
      }))
      .filter((r) => r.n > 0 || (group === 'posted' ? s.posted === r.value : s[group].includes(r.value)))
    if (!rows.length) return null
    return (
      <div className="filter-group">
        <h3 className="filter-title">{title}</h3>
        <ul className="filter-list">
          {rows.map((r) => (
            <li key={r.value}>
              <label>
                {group === 'posted' ? (
                  <input type="radio" name="posted" value={r.value} checked={s.posted === r.value} onChange={(e) => set({ posted: e.target.checked ? r.value : '' })} />
                ) : (
                  <input type="checkbox" name={group} value={r.value} checked={s[group].includes(r.value)} onChange={(e) => toggle(group, r.value, e.target.checked)} />
                )}
                <span>{r.label}</span>
                <span className="filter-num">{r.n}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <>
      <div className="section-head jobs-head">
        <div>
          <span className="eyebrow">Work in Seattle</span>
          <h1>Job board</h1>
        </div>
        <Link href="/advertise" className="btn">
          Post a job
        </Link>
      </div>

      <div className="jobs-layout">
        <aside className="jobs-filters">
          <Link href="/advertise" className="jobs-post-side">
            <span className="jobs-post-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
              </svg>
            </span>
            <span className="jobs-post-text">
              <span className="jobs-post-kicker">Hiring in Seattle?</span>
              <span className="jobs-post-title">Post a job &rarr;</span>
            </span>
          </Link>
          <button className={`jobs-filters-toggle${open ? ' is-open' : ''}`} type="button" aria-expanded={open} aria-controls="jobs-filters-body" onClick={() => setOpen((v) => !v)}>
            Filters
          </button>
          <div className={`jobs-filters-body${open ? ' open' : ''}`} id="jobs-filters-body">
            <div className="widget">
              <div className="widget-head">Filters</div>
              <div className="widget-body">
                <div className="filter-group">
                  <label className="filter-search">
                    <span className="sr-only">Search openings</span>
                    <input type="search" placeholder="Job title, company or skill" value={s.query} onChange={(e) => set({ query: e.target.value })} />
                  </label>
                </div>

                <div className="filter-group">
                  <h3 className="filter-title">Category</h3>
                  <ul className="filter-list filter-list--cats">
                    {['All', ...categories]
                      .map((c) => ({ c, n: c === 'All' ? jobs.filter((j) => matches(j, 'category')).length : count('category', (j) => j.category === c) }))
                      .filter(({ c, n }) => n > 0 || c === s.category)
                      .map(({ c, n }) => (
                        <li key={c}>
                          <button type="button" className={c === s.category ? 'active' : undefined} onClick={() => set({ category: c })}>
                            <span>{c === 'All' ? 'All categories' : c}</span>
                            <span className="filter-num">{n}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>

                {checkGroup('Suits you', 'openTo', OPEN_TO)}

                {salarySteps.length ? (
                  <div className="filter-group">
                    <h3 className="filter-title">Salary, $ per year</h3>
                    <div className="filter-pair">
                      <label>
                        <span className="sr-only">Minimum salary</span>
                        <select value={s.salaryMin ?? ''} onChange={(e) => set({ salaryMin: Number(e.target.value) || null })}>
                          <option value="">from</option>
                          {salarySteps.map((v) => (
                            <option key={v} value={v}>
                              {v.toLocaleString('en-US')}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span aria-hidden="true">&ndash;</span>
                      <label>
                        <span className="sr-only">Maximum salary</span>
                        <select value={s.salaryMax ?? ''} onChange={(e) => set({ salaryMax: Number(e.target.value) || null })}>
                          <option value="">to</option>
                          {salarySteps.map((v) => (
                            <option key={v} value={v}>
                              {v.toLocaleString('en-US')}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}

                {checkGroup('Employment', 'types', uniq(jobs.map((j) => j.type)).map((t) => [t, t]))}
                {checkGroup('Work mode', 'workModes', ['on-site', 'hybrid', 'remote'].map((m) => [m, WORK_MODE_LABEL[m]]))}
                {checkGroup('Perks', 'perks', uniq(jobs.flatMap((j) => j.perks)).map((p) => [p, p]))}
                {checkGroup('Language a plus', 'languages', uniq(jobs.flatMap((j) => j.languages)).map((l) => [l, l]))}
                {checkGroup('Posted', 'posted', POSTED)}

                <button type="button" className="btn btn-outline btn-sm btn-block jobs-reset" onClick={() => setS({ ...EMPTY, sort: s.sort })}>
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="jobs-results">
          {/* Sort row right above the first card, at its left edge (client, 02.10.2026). */}
          <div className="jobs-toolbar">
            <div className="jobs-sort" role="group" aria-label="Sort jobs">
              <span className="jobs-sort-label">Sort</span>
              {SORTS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`jobs-sort-chip${s.sort === value ? ' is-active' : ''}`}
                  aria-pressed={s.sort === value}
                  onClick={() => set({ sort: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="job-list">
            {found.length ? (
              found.map((j) => (
                <article key={j.id} className="job-card">
                  {j.urgent || j.featured ? (
                    <div className="job-card-badges">
                      {j.urgent ? <span className="job-badge job-badge--urgent">Urgent</span> : null}
                      {j.featured ? <span className="job-badge job-badge--featured">Featured</span> : null}
                    </div>
                  ) : null}
                  <div className="job-card-body">
                    <Link className="job-card-title" href={`/jobs/${j.slug}`}>
                      {j.title}
                    </Link>
                    {j.salary ? <div className="job-card-salary">{j.salary}</div> : null}
                    <div className="job-card-company">
                      {j.companyHref ? <Link href={j.companyHref}>{j.company}</Link> : <span>{j.company}</span>}
                      <span className="job-card-type">{j.type}</span>
                    </div>
                    {j.location ? (
                      <div className="job-card-place">
                        <Pin />
                        <span>{j.location}</span>
                      </div>
                    ) : null}
                    <ul className="job-card-checks">
                      {[
                        ...j.openTo.map((k) => OPEN_TO_LABEL[k]),
                        ...(j.workMode !== 'on-site' ? [`${WORK_MODE_LABEL[j.workMode]} work`] : []),
                        ...(j.languages.length ? [`${j.languages.join(', ')} a plus`] : []),
                      ].map((l) => (
                        <li key={l}>
                          <Check />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                    {j.summary ? <p className="job-card-desc">{j.summary}</p> : null}
                  </div>
                  <div className="job-card-side">
                    <div className="job-card-logo" aria-hidden="true">
                      {monogram(j.company)}
                    </div>
                    <span className="job-card-posted" suppressHydrationWarning>
                      {relative(j.postedAt)}
                    </span>
                    <Link className="job-card-save" href={`/jobs/${j.slug}`}>
                      View &amp; apply
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No openings match those filters. Try widening your search.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
