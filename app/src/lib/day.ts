/**
 * `YYYY-MM-DD` that is a real calendar day, 2000–2100. The shape alone is not enough: `2026-02-30` is no
 * day (`new Date()` of it is invalid and `toISOString()` throws) and Postgres has no year 0 — both were a
 * 500 instead of "Pick a date" (QA 27.11.2026). A date input never sends such a value; a script does.
 */
export const isDay = (v: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < '2000-01-01' || v > '2100-12-31') return false
  const t = Date.parse(`${v}T12:00:00.000Z`)
  return Number.isFinite(t) && new Date(t).toISOString().startsWith(v)
}
