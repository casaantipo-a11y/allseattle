'use client'

import Link from 'next/link'
import { Fragment, useMemo, useState, type ReactNode } from 'react'

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
  /** Views in the last 30 days — set only from VIEWS_SHOW_MIN up (lib/stats.ts). */
  views?: number
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

// A model name that starts with a digit ("3", "3 Series") says nothing on its own
// in the catalog or the Model list (client, 12.10.2026: "what model is 3?"), so
// those carry the make: "Mazda 3", "BMW 3 Series". The filter value stays the model.
const modelLabel = (make: string, model: string) => (/^\d/.test(model) ? `${make} ${model}` : model)

// Round price suggestions for the "from / to" fields — the fields also take any
// number typed by hand (client, 22.11.2026: steps of 5,000 from the listings'
// own range were too coarse — two cars gave just 10,000 / 15,000 / 20,000).
const PRICE_HINTS = [2000, 3000, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 75000, 100000]
const digits = (v: string) => Number(v.replace(/\D/g, '')) || null

export function CarsCatalog({
  cars,
  rightRail,
  feedAd,
  feedAds = [],
}: {
  cars: CarItem[]
  rightRail?: ReactNode
  /** B2 — the strip in the list after the 10th car (client's Cars scheme, 12.10.2026). */
  feedAd?: ReactNode
  /** The right column's banners inside the list below 1024px (after car `after`; past the end of
   *  a short list — after it). Under the list they stood back to back (client, 19.10.2026). */
  feedAds?: { after: number; node: ReactNode }[]
}) {
  const [s, setS] = useState<State>(EMPTY)
  const [adv, setAdv] = useState(false)
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }))

  const makes = uniq(cars.map((c) => c.make))
  const makeOf = (model: string) => cars.find((c) => c.model === model)?.make ?? ''
  const models = uniq((s.make ? cars.filter((c) => c.make === s.make) : cars).map((c) => c.model))
  // With no make chosen the options read "Audi A5", so they go in that order.
  if (!s.make) models.sort((a, b) => `${makeOf(a)} ${a}`.localeCompare(`${makeOf(b)} ${b}`))
  const [priceText, setPriceText] = useState({ min: '', max: '' })
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

  // The left catalog: makes with their counts; a chosen make lists its models
  // (client, 22.11.2026: a bare "A5" did not say it was an Audi, and the makes
  // themselves were nowhere).
  const catalog = useMemo(() => {
    const count = (key: (c: CarItem) => string, list: CarItem[]) => {
      const n = new Map<string, number>()
      for (const c of list) n.set(key(c), (n.get(key(c)) ?? 0) + 1)
      return [...n].map(([name, num]) => ({ name, num })).sort((a, b) => a.name.localeCompare(b.name))
    }
    return s.make ? count((c) => c.model, cars.filter((c) => c.make === s.make)) : count((c) => c.make, cars)
  }, [cars, s.make])

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
                <option key={m} value={m}>
                  {s.make ? modelLabel(s.make, m) : `${makeOf(m)} ${m}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div className="field auto-field-pair">
            <label htmlFor="f-price-min">Price, $</label>
            <div>
              <input
                id="f-price-min"
                aria-label="Minimum price"
                inputMode="numeric"
                autoComplete="off"
                list="f-price-hints"
                placeholder="from"
                value={priceText.min}
                onChange={(e) => {
                  setPriceText((p) => ({ ...p, min: e.target.value }))
                  set({ priceMin: digits(e.target.value) })
                }}
              />
              <span aria-hidden="true">&ndash;</span>
              <input
                id="f-price-max"
                aria-label="Maximum price"
                inputMode="numeric"
                autoComplete="off"
                list="f-price-hints"
                placeholder="to"
                value={priceText.max}
                onChange={(e) => {
                  setPriceText((p) => ({ ...p, max: e.target.value }))
                  set({ priceMax: digits(e.target.value) })
                }}
              />
              <datalist id="f-price-hints">
                {PRICE_HINTS.map((p) => (
                  <option key={p} value={p.toLocaleString('en-US')} />
                ))}
              </datalist>
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
          <button className="btn btn-outline btn-sm auto-search-reset" type="button" onClick={() => {
              setS(EMPTY)
              setPriceText({ min: '', max: '' })
            }}>
            Reset filters
          </button>
        </div>
      </form>

      <div className="auto-layout">
        <aside className="auto-rail auto-rail--left">
          <div className="widget from-1024-block">
            <div className="widget-head">Car catalog</div>
            <div className="widget-body">
              {s.make ? <div className="auto-cats-make">{s.make}</div> : null}
              <ul className="auto-cats">
                {catalog.map((r) => {
                  const active = s.make ? s.model === r.name : false
                  return (
                    <li key={r.name}>
                      <button
                        type="button"
                        className={active ? 'active' : undefined}
                        onClick={() => (s.make ? set({ model: active ? '' : r.name }) : set({ make: r.name, model: '' }))}
                      >
                        <span>{s.make ? modelLabel(s.make, r.name) : r.name}</span>
                        <span className="auto-cats-num">{r.num}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {s.make ? (
                <button type="button" className="auto-cats-all" onClick={() => set({ make: '', model: '' })}>
                  &larr; All makes
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="auto-results">
          {/* No model catalog below 1024 (client, 19.10.2026: the "Model" button there was
              removed — the search panel above has Make and Model). */}
          <div className="car-list">
            {found.length ? (
              found.map((c, i) => (
                <Fragment key={c.id}>
                <article className="car-row">
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
                    {c.views ? <div className="car-row-ref">{`${c.views.toLocaleString('en-US')} views in 30 days`}</div> : null}
                  </div>
                </article>
                {i === 9 && found.length > 10 && feedAd ? <div className="car-infeed-ad">{feedAd}</div> : null}
                {feedAds.filter((a) => a.after === i + 1).map((a, k) => (
                  <div key={k} className="below-1024 car-infeed-ad">{a.node}</div>
                ))}
                </Fragment>
              ))
            ) : (
              <p className="muted">No cars match those filters. Try widening your search.</p>
            )}
            {feedAds.filter((a) => a.after > found.length).map((a, k) => (
              <div key={k} className="below-1024 car-infeed-ad">{a.node}</div>
            ))}
            {/* B2 is after the 10th car; a shorter list gets it at the end (client, 20.10.2026). */}
            {found.length <= 10 && feedAd ? <div className="car-infeed-ad">{feedAd}</div> : null}
          </div>
        </div>

        <aside className="auto-rail auto-rail--right">
          <div className="from-1024">{rightRail}</div>
        </aside>
      </div>
    </>
  )
}
