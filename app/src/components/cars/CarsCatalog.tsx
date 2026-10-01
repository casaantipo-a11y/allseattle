'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

// The prototype's car catalog (auto/index.html + js/pages/auto-catalog.js,
// css: styles/auto.css), unchanged in behaviour: a navy search bar that
// filters as you pick, "Advanced search", the model catalog on the left, dense
// rows in the middle. Only the data is real now. The client asked not to
// redesign Cars until their annotated screenshots arrive (spec §13).

export type CarItem = {
  id: number
  slug: string
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  engine?: string | null
  transmission: string
  fuel: string
  bodyType: string
  color?: string | null
  description?: string | null
  photo?: string | null
  postedAt: string
  ref: string
  featured: boolean
}

const fmtPrice = (n: number) => `$${n.toLocaleString('en-US')}`
const fmtMileage = (n: number) => `${n.toLocaleString('en-US')} mi`
const BODY_LABEL: Record<string, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  hatchback: 'Hatchback',
  coupe: 'Coupe',
  convertible: 'Convertible',
  wagon: 'Wagon',
  van: 'Van / minivan',
}

function relative(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
}

type State = {
  make: string
  model: string
  priceMin: number | null
  priceMax: number | null
  yearMin: number | null
  yearMax: number | null
  body: string
  transmission: string
  fuel: string
  maxMileage: number | null
  sort: string
}
const EMPTY: State = {
  make: '',
  model: '',
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  body: '',
  transmission: '',
  fuel: '',
  maxMileage: null,
  sort: 'default',
}

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort()

export function CarsCatalog({
  cars,
  leftExtra,
  middleTop,
  rightRail,
}: {
  cars: CarItem[]
  /** Under the model catalog in the left column. */
  leftExtra?: ReactNode
  /** Above the car list in the middle column (the business list, a banner). */
  middleTop?: ReactNode
  rightRail?: ReactNode
}) {
  const [s, setS] = useState<State>(EMPTY)
  const [adv, setAdv] = useState(false)
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }))

  const makes = uniq(cars.map((c) => c.make))
  const models = uniq((s.make ? cars.filter((c) => c.make === s.make) : cars).map((c) => c.model))
  const priceSteps = useMemo(() => {
    if (!cars.length) return []
    const prices = cars.map((c) => c.price)
    const lo = Math.floor(Math.min(...prices) / 5000) * 5000
    const hi = Math.ceil(Math.max(...prices) / 5000) * 5000
    const out: number[] = []
    for (let p = lo; p <= hi; p += 5000) out.push(p)
    return out
  }, [cars])
  const years = [...new Set(cars.map((c) => c.year))].sort((a, b) => a - b)

  const found = useMemo(() => {
    const list = cars.filter(
      (c) =>
        (!s.make || c.make === s.make) &&
        (!s.model || c.model === s.model) &&
        (!s.priceMin || c.price >= s.priceMin) &&
        (!s.priceMax || c.price <= s.priceMax) &&
        (!s.yearMin || c.year >= s.yearMin) &&
        (!s.yearMax || c.year <= s.yearMax) &&
        (!s.body || c.bodyType === s.body) &&
        (!s.transmission || c.transmission === s.transmission) &&
        (!s.fuel || c.fuel === s.fuel) &&
        (!s.maxMileage || c.mileage <= s.maxMileage),
    )
    const by = {
      'price-asc': (a: CarItem, b: CarItem) => a.price - b.price,
      'price-desc': (a: CarItem, b: CarItem) => b.price - a.price,
      'year-desc': (a: CarItem, b: CarItem) => b.year - a.year,
      'mileage-asc': (a: CarItem, b: CarItem) => a.mileage - b.mileage,
      // Default: featured first, then the newest (or most recently bumped).
      default: (a: CarItem, b: CarItem) => Number(b.featured) - Number(a.featured) || +new Date(b.postedAt) - +new Date(a.postedAt),
    }[s.sort as 'default']
    return [...list].sort(by ?? (() => 0))
  }, [cars, s])

  const catalog = useMemo(() => {
    const rows: { make: string; model: string; n: number }[] = []
    for (const c of cars) {
      const r = rows.find((x) => x.make === c.make && x.model === c.model)
      if (r) r.n += 1
      else rows.push({ make: c.make, model: c.model, n: 1 })
    }
    return rows.sort((a, b) => a.model.localeCompare(b.model))
  }, [cars])

  const num = (v: string) => Number(v) || null

  return (
    <>
      <form className="auto-search" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="auto-search-row">
          <div className="field">
            <label htmlFor="f-make">Make</label>
            <select id="f-make" value={s.make} onChange={(e) => set({ make: e.target.value, model: '' })}>
              <option value="">All makes</option>
              {makes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-model">Model</label>
            <select id="f-model" value={s.model} onChange={(e) => set({ model: e.target.value })}>
              <option value="">All models</option>
              {models.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field auto-field-pair">
            <label htmlFor="f-price-min">Price, $</label>
            <div>
              <select id="f-price-min" aria-label="Minimum price" value={s.priceMin ?? ''} onChange={(e) => set({ priceMin: num(e.target.value) })}>
                <option value="">from</option>
                {priceSteps.map((p) => (
                  <option key={p} value={p}>
                    {p.toLocaleString('en-US')}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">&ndash;</span>
              <select id="f-price-max" aria-label="Maximum price" value={s.priceMax ?? ''} onChange={(e) => set({ priceMax: num(e.target.value) })}>
                <option value="">to</option>
                {priceSteps.map((p) => (
                  <option key={p} value={p}>
                    {p.toLocaleString('en-US')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field auto-field-pair">
            <label htmlFor="f-year-min">Year</label>
            <div>
              <select id="f-year-min" aria-label="Earliest year" value={s.yearMin ?? ''} onChange={(e) => set({ yearMin: num(e.target.value) })}>
                <option value="">from</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">&ndash;</span>
              <select id="f-year-max" aria-label="Latest year" value={s.yearMax ?? ''} onChange={(e) => set({ yearMax: num(e.target.value) })}>
                <option value="">to</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn" type="submit">
            Find
          </button>
        </div>

        <button type="button" className={`auto-search-more${adv ? ' is-open' : ''}`} aria-expanded={adv} onClick={() => setAdv((v) => !v)}>
          Advanced search
        </button>

        <div className={`auto-search-adv${adv ? ' open' : ''}`}>
          <div className="field">
            <label htmlFor="f-body">Body type</label>
            <select id="f-body" value={s.body} onChange={(e) => set({ body: e.target.value })}>
              <option value="">Any body</option>
              {uniq(cars.map((c) => c.bodyType)).map((b) => (
                <option key={b} value={b}>
                  {BODY_LABEL[b] ?? b}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-transmission">Transmission</label>
            <select id="f-transmission" value={s.transmission} onChange={(e) => set({ transmission: e.target.value })}>
              <option value="">Any transmission</option>
              {uniq(cars.map((c) => c.transmission)).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-fuel">Fuel</label>
            <select id="f-fuel" value={s.fuel} onChange={(e) => set({ fuel: e.target.value })}>
              <option value="">Any fuel</option>
              {uniq(cars.map((c) => c.fuel)).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-mileage">Max mileage</label>
            <select id="f-mileage" value={s.maxMileage ?? ''} onChange={(e) => set({ maxMileage: num(e.target.value) })}>
              <option value="">Any mileage</option>
              {[25000, 40000, 60000, 80000, 120000].map((m) => (
                <option key={m} value={m}>
                  Under {m.toLocaleString('en-US')} mi
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-sort">Sort by</label>
            <select id="f-sort" value={s.sort} onChange={(e) => set({ sort: e.target.value })}>
              <option value="default">Newest listed</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="year-desc">Year: Newest first</option>
              <option value="mileage-asc">Mileage: Lowest first</option>
            </select>
          </div>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setS(EMPTY)}>
            Reset filters
          </button>
        </div>
      </form>

      <div className="auto-layout">
        <aside className="auto-rail auto-rail--left">
          <div className="widget">
            <div className="widget-head">Car catalog</div>
            <div className="widget-body">
              <ul className="auto-cats">
                {catalog.map((r) => (
                  <li key={`${r.make}-${r.model}`}>
                    <button type="button" className={s.model === r.model ? 'active' : undefined} onClick={() => set({ make: r.make, model: r.model })}>
                      <span>{r.model}</span>
                      <span className="auto-cats-num">{r.n}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="auto-cats-all" onClick={() => set({ make: '', model: '' })}>
                All models &rarr;
              </button>
            </div>
          </div>
          {leftExtra}
        </aside>

        <div className="auto-results">
          {middleTop}
          <h2 className="auto-all-cars" id="all-cars">
            All cars
          </h2>
          <p className="result-count" aria-live="polite">
            {found.length === cars.length ? `${cars.length} cars listed` : `Showing ${found.length} of ${cars.length} cars`}
          </p>
          <div className="car-list">
            {found.length ? (
              found.map((c) => (
                <article key={c.id} className="car-row">
                  <Link className="car-row-photo" href={`/cars/${c.slug}`} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- card rendition from Payload */}
                    {c.photo ? <img src={c.photo} alt="" loading="lazy" /> : null}
                  </Link>
                  <div className="car-row-body">
                    <Link className="car-row-title" href={`/cars/${c.slug}`}>
                      {c.title}
                    </Link>
                    <div className="car-row-specs">
                      {[c.engine, fmtMileage(c.mileage), c.transmission, c.color, c.fuel].filter(Boolean).map((x) => (
                        <span key={x as string}>{x}</span>
                      ))}
                    </div>
                    {c.description ? <p className="car-row-desc">{c.description}</p> : null}
                  </div>
                  <div className="car-row-meta">
                    <div className="car-row-price">{fmtPrice(c.price)}</div>
                    <div className="car-row-posted" suppressHydrationWarning>
                      {relative(c.postedAt)}
                    </div>
                    <div className="car-row-ref">{c.ref}</div>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No cars match those filters. Try widening your search.</p>
            )}
          </div>
        </div>

        <aside className="auto-rail auto-rail--right">{rightRail}</aside>
      </div>
    </>
  )
}
