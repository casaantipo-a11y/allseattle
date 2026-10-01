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
