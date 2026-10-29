// Wall-clock time in a zone → UTC, without a date library. Daylight saving is
// settled by asking Intl what the zone's offset is at the instant in question, so
// the same code is right on both sides of the change (2 Nov 2025 / 1 Nov 2026 …).

export const SEATTLE_TZ = 'America/Los_Angeles'

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(tz: string) {
  let f = formatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatters.set(tz, f)
  }
  return f
}

/** Is this an IANA zone name this runtime knows? (ICS feeds may send Windows names.) */
export function isKnownZone(tz: string): boolean {
  try {
    formatter(tz)
    return true
  } catch {
    return false
  }
}

/** Offset of the zone from UTC, in ms, at the given instant. */
function offsetAt(tz: string, utcMs: number): number {
  const p: Record<string, string> = {}
  for (const part of formatter(tz).formatToParts(new Date(utcMs))) p[part.type] = part.value
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
  return wall - Math.floor(utcMs / 1000) * 1000
}

/**
 * Wall-clock time in `tz` → the UTC instant. In the hour that happens twice when
 * clocks go back, the first (daylight) one is taken; a time that doesn't exist when
 * clocks go forward lands an hour later, like calendar apps do.
 */
export function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): Date {
  const wall = Date.UTC(y, mo - 1, d, h, mi, s)
  let utc = wall - offsetAt(tz, wall)
  const again = offsetAt(tz, utc)
  if (wall - utc !== again) utc = wall - again
  return new Date(utc)
}
