/**
 * A row id taken from a URL, a form or a request body: a whole number that fits the database's
 * integer column (up to 2147483647), else -1 — a row that does not exist, so the caller answers
 * "not found" like for any other unknown id. A huge number (99999999999999999999) used to reach the
 * query as it was and came back as a 500 ("value is out of range for type integer"). Never 0:
 * Payload refuses a falsy id with an error of its own.
 */
export const rowId = (raw: unknown): number => {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d{1,10}$/.test(raw) ? Number(raw) : NaN
  return Number.isSafeInteger(n) && n > 0 && n <= 2147483647 ? n : -1
}
