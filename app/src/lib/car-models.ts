/** A model typed by a seller, matched to the make's list ignoring case and stray
 *  spaces ("a5 " → "A5"), or undefined when the make's list has no such model. */
function listedModel(models: string[] | null | undefined, typed: string): string | undefined {
  const key = typed.trim().replace(/\s+/g, ' ').toLowerCase()
  return (models ?? []).find((m) => m.trim().replace(/\s+/g, ' ').toLowerCase() === key)?.trim()
}

/** A model typed by a seller, matched to the make's list ignoring case and stray
 *  spaces ("a5 " → "A5"). A model that is not on the list is kept as typed: the
 *  list is a hint, not a gate (client, 22.11.2026 — a 2018 Audi A5 and a Range
 *  Rover Sport could not be listed), and every listing is moderated anyway. */
export function canonicalModel(models: string[] | null | undefined, typed: string): string {
  const t = typed.trim().replace(/\s+/g, ' ')
  return listedModel(models, t) ?? t
}

/** Parts of a model that stay in capitals ("4WD", "XLT", "R/T", "GTI"…). */
const ABBREVIATIONS = new Set(
  'AWD FWD RWD 4WD 4X4 2D 4D V6 V8 SE LE XLE LX EX EX-L GT GTI GTS SRT RS AMG TRD SR SR5 SXT SL SLT LT LTZ XL XLT ST SS RT R/T SV SR HD LTD TDI EV PHEV'.split(' '),
)

const casePart = (p: string): string => {
  if (!p) return p
  if (/\d/.test(p) || ABBREVIATIONS.has(p.toUpperCase())) return p.toUpperCase()
  return p[0].toUpperCase() + p.slice(1).toLowerCase()
}

/**
 * The model as it is shown in a listing's title (client, 23.11.2026: "2015 NISSAN ROGUE" next to
 * "2018 Audi a5 sport" — one look, not capitals). A model on the make's list is spelled as on the
 * list ("cr-v" → "CR-V"); any other: a word with a digit is all capitals ("a5" → "A5", "2d" →
 * "2D"), an abbreviation from the list above too ("xlt" → "XLT"), otherwise a capital first letter
 * and the rest small ("ROGUE" → "Rogue"). The parts of "f-150" and "r/t" are looked at one by one.
 */
export function normalizeModel(models: string[] | null | undefined, typed: string): string {
  const t = typed.trim().replace(/\s+/g, ' ')
  const listed = listedModel(models, t)
  if (listed) return listed
  return t
    .split(' ')
    .map((word) => (ABBREVIATIONS.has(word.toUpperCase()) ? word.toUpperCase() : word.split(/([-/])/).map((part, i) => (i % 2 ? part : casePart(part))).join('')))
    .join(' ')
}
