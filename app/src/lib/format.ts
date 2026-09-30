import { SITE_TZ } from './site'

// All dates on the site are shown in Seattle time, whatever the server's or
// the visitor's own time zone is.

const part = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: SITE_TZ, ...opts }).format(d)

/** Feed format from the spec: `Jan 23 | 5:53 PM`. */
export function feedDate(iso: string | Date): string {
  const d = new Date(iso)
  return `${part(d, { month: 'short', day: 'numeric' })} | ${part(d, { hour: 'numeric', minute: '2-digit' })}`
}

/** `Tuesday, September 30, 2026` */
export function longDate(iso: string | Date = new Date()): string {
  return part(new Date(iso), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/** `Tue, Sep 30` — the header plate. */
export function shortDate(iso: string | Date = new Date()): string {
  return part(new Date(iso), { weekday: 'short', month: 'short', day: 'numeric' })
}

/** `Tue, Sep 30, 5:53 PM` — the ticking clock in the header. */
export function clockText(d: Date = new Date()): string {
  return part(d, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
