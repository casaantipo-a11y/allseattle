import type { Event, EventCategory } from '@/payload-types'

import { SITE_TZ } from './site'

// Date windows for the events filter (spec §5: today / weekend / month), all
// in Seattle time.

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: SITE_TZ, ...o }).format(d)
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

export type When = 'all' | 'today' | 'weekend' | 'month'
export const WHEN: { value: When; label: string }[] = [
  { value: 'all', label: 'All upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'month', label: 'This month' },
]

// Sort orders for the events list (client, 09.10.2026), the same set as Jobs'
// "Newest / Highest pay / Lowest pay / Company A–Z".
export type EventSort = 'soonest' | 'price-asc' | 'price-desc' | 'title'
export const EVENT_SORTS: { value: EventSort; label: string }[] = [
  { value: 'soonest', label: 'Soonest' },
  { value: 'price-asc', label: 'Lowest price' },
  { value: 'price-desc', label: 'Highest price' },
  { value: 'title', label: 'A–Z' },
]

/** Free is 0; otherwise the first number in the price text ("$15–25" → 15); none → unknown. */
const priceValue = (ev: Pick<Event, 'isFree' | 'price'>) => {
  if (ev.isFree) return 0
  const m = (ev.price || '').replace(/,/g, '').match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/** A sorted copy; ties (and events with no price) fall back to the start date. */
export function sortEvents<T extends Pick<Event, 'startAt' | 'title' | 'isFree' | 'price'>>(list: T[], sort: EventSort): T[] {
  const byDate = (a: T, b: T) => +new Date(a.startAt) - +new Date(b.startAt)
  const byPrice = (dir: 1 | -1) => (a: T, b: T) => {
    const pa = priceValue(a)
    const pb = priceValue(b)
    if (pa === null || pb === null) return pa === pb ? byDate(a, b) : pa === null ? 1 : -1
    return (pa - pb) * dir || byDate(a, b)
  }
  const cmp = { soonest: byDate, 'price-asc': byPrice(1), 'price-desc': byPrice(-1), title: (a: T, b: T) => a.title.localeCompare(b.title) || byDate(a, b) }[sort]
  return [...list].sort(cmp)
}

/** Does the event (start…end) touch the window? */
export function inWindow(ev: Pick<Event, 'startAt' | 'endAt'>, when: When, now = new Date()): boolean {
  if (when === 'all') return true
  const start = new Date(ev.startAt)
  const end = ev.endAt ? new Date(ev.endAt) : start
  const days: string[] = []
  const add = (offset: number) => days.push(dayKey(new Date(now.getTime() + offset * 86400000)))
  if (when === 'today') add(0)
  if (when === 'weekend') {
    const wd = fmt(now, { weekday: 'short' }) // Mon…Sun in Seattle
    const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
    // Friday evening to Sunday: from Friday (or today if already in the weekend) to Sunday.
    const toFri = idx === 0 ? -2 : idx === 6 ? -1 : 5 - idx
    for (let o = toFri; o <= toFri + 2; o++) add(o)
  }
  if (when === 'month') {
    const month = fmt(now, { year: 'numeric', month: '2-digit' })
    for (let o = 0; o < 32; o++) {
      const d = new Date(now.getTime() + o * 86400000)
      if (fmt(d, { year: 'numeric', month: '2-digit' }) === month) days.push(dayKey(d))
    }
  }
  const s = dayKey(start)
  const e = dayKey(end)
  return days.some((d) => d >= s && d <= e)
}

export function dateParts(iso: string) {
  const d = new Date(iso)
  return {
    month: fmt(d, { month: 'short' }).toUpperCase(),
    day: fmt(d, { day: 'numeric' }),
    weekday: fmt(d, { weekday: 'short' }),
    time: fmt(d, { hour: 'numeric', minute: '2-digit' }),
    long: fmt(d, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  }
}

export const priceLabel = (ev: Pick<Event, 'isFree' | 'price'>) => (ev.isFree ? 'Free' : ev.price || '')
export const categoryOf = (ev: Event) => (typeof ev.category === 'object' ? (ev.category as EventCategory) : null)
