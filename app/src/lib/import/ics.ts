import { htmlToText, oneLine, safeLink } from './text'
import { isKnownZone, SEATTLE_TZ, zonedToUtc } from './time'
import { skip, WINDOW_DAYS, type EventCandidate, type ImportStats } from './types'

// A small iCalendar (RFC 5545) reader — only what the city calendars (Trumba) use:
// VEVENTs with UID, SUMMARY, LOCATION, DESCRIPTION, URL, DTSTART / DTEND with a TZID,
// in UTC, or as a plain date. Trumba writes every occurrence of a repeating event as
// its own VEVENT with its own UID; an event that does carry RRULE / RDATE /
// RECURRENCE-ID is skipped and counted instead of guessed at.

type IcsDate = { value: string; tzid?: string }
type IcsEvent = {
  uid: string
  summary: string
  location: string
  description: string
  url: string
  start?: IcsDate
  end?: IcsDate
  recurring: boolean
}

type Line = { name: string; params: Record<string, string>; value: string }

function parseLine(line: string): Line | null {
  let inQuote = false
  let colon = -1
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuote = !inQuote
    else if (c === ':' && !inQuote) {
      colon = i
      break
    }
  }
  if (colon < 1) return null
  const head: string[] = []
  let cur = ''
  inQuote = false
  for (const c of line.slice(0, colon)) {
    if (c === '"') inQuote = !inQuote
    if (c === ';' && !inQuote) {
      head.push(cur)
      cur = ''
    } else cur += c
  }
  head.push(cur)
  const params: Record<string, string> = {}
  for (const part of head.slice(1)) {
    const eq = part.indexOf('=')
    if (eq > 0) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name: head[0].toUpperCase(), params, value: line.slice(colon + 1) }
}

const unescapeText = (s: string) => s.replace(/\\([nN,;\\])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))

export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const events: IcsEvent[] = []
  let cur: IcsEvent | null = null
  let alarm = 0
  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') {
      cur = { uid: '', summary: '', location: '', description: '', url: '', recurring: false }
      alarm = 0
      continue
    }
    if (line === 'END:VEVENT') {
      if (cur) events.push(cur)
      cur = null
      continue
    }
    if (!cur) continue
    // Reminders inside an event have their own DESCRIPTION — not the event's.
    if (line === 'BEGIN:VALARM') alarm++
    else if (line === 'END:VALARM') alarm--
    if (alarm > 0) continue
    const l = parseLine(line)
    if (!l) continue
    switch (l.name) {
      case 'UID':
        cur.uid ||= l.value.trim()
        break
      case 'SUMMARY':
        cur.summary ||= unescapeText(l.value)
        break
      case 'LOCATION':
        cur.location ||= unescapeText(l.value)
        break
      case 'DESCRIPTION':
        cur.description ||= unescapeText(l.value)
        break
      case 'URL':
        cur.url ||= l.value.trim()
        break
      case 'DTSTART':
        cur.start ??= { value: l.value.trim(), tzid: l.params.TZID }
        break
      case 'DTEND':
        cur.end ??= { value: l.value.trim(), tzid: l.params.TZID }
        break
      case 'RRULE':
      case 'RDATE':
      case 'RECURRENCE-ID':
        cur.recurring = true
        break
    }
  }
  return events
}

/** `20261025T084500`, `…Z` or `20261025` → a UTC instant. A zone we don't know falls back to Seattle's. */
export function icsDateToUtc(d: IcsDate): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(d.value)
  if (!m) return null
  // A plain date has no time groups: they are undefined, and Number(undefined) is NaN, not 0.
  const [y, mo, day, h, mi, s] = m.slice(1, 7).map((v) => (v === undefined ? 0 : Number(v)))
  // Date.UTC rolls a month 13 or a Nov 31 over into another date instead of refusing it.
  const probe = new Date(Date.UTC(y, mo - 1, day))
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== day || h > 23 || mi > 59 || s > 60) return null
  try {
    const date = m[7] ? new Date(Date.UTC(y, mo - 1, day, h, mi, s)) : zonedToUtc(y, mo, day, h, mi, s, d.tzid && isKnownZone(d.tzid) ? d.tzid : SEATTLE_TZ)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null // an impossible date (month 13, hour 25) is one bad event, not a failed source
  }
}

/**
 * LOCATION in these feeds is "Venue<br>Street<br>City, WA 12345". The first part is
 * the venue, the rest the address. A one-part location that starts with a number is
 * a street address and serves as both.
 */
function splitLocation(raw: string): { venueName: string; address?: string } | null {
  const parts = raw
    .split(/<br\s*\/?>|\n/i)
    .map((s) => oneLine(htmlToText(s), 200))
    .filter(Boolean)
  if (!parts.length) return null
  if (parts.length === 1) return { venueName: parts[0], address: /^\d/.test(parts[0]) ? parts[0] : undefined }
  return { venueName: parts[0], address: parts.slice(1).join(', ') }
}

/**
 * The importable events of a feed starting between `now` and `WINDOW_DAYS` ahead,
 * soonest first. Anything unusable is counted in `stats` and left out.
 */
export function icsCandidates(text: string, stats: ImportStats, now = new Date()): EventCandidate[] {
  const until = now.getTime() + WINDOW_DAYS * 86400000
  const out: EventCandidate[] = []
  const seen = new Set<string>()
  for (const e of parseIcs(text)) {
    const startAt = e.start ? icsDateToUtc(e.start) : null
    if (!startAt) {
      skip(stats, 'no valid start')
      continue
    }
    if (startAt.getTime() < now.getTime() || startAt.getTime() > until) continue
    if (e.recurring) {
      skip(stats, 'recurring (not imported)')
      continue
    }
    const title = oneLine(htmlToText(e.summary), 200)
    if (!e.uid || !title) {
      skip(stats, 'no id or title')
      continue
    }
    // Trumba marks a cancelled event in its title ("CANCELLED - Council Briefing").
    if (/^\W*(cancell?ed|postponed)\b/i.test(title)) {
      skip(stats, 'cancelled')
      continue
    }
    const externalId = e.uid.slice(0, 250)
    if (seen.has(externalId)) continue
    seen.add(externalId)
    const where = splitLocation(e.location)
    if (!where) {
      skip(stats, 'no location')
      continue
    }
    const endAt = e.end ? icsDateToUtc(e.end) : null
    out.push({
      externalId,
      title,
      startAt,
      endAt: endAt && endAt >= startAt ? endAt : undefined,
      ...where,
      isFree: false,
      ticketUrl: safeLink(e.url),
      description: htmlToText(e.description) || undefined,
    })
  }
  return out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}
