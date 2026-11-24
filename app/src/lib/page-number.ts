/**
 * The `?page=` of a list: a whole number from 1 up. A huge or fractional value would otherwise
 * become an offset the database refuses (a 500); past the last page the list is simply empty.
 */
export const pageNumber = (raw: unknown): number => {
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10000) : 1
}
