/** A model typed by a seller, matched to the make's list ignoring case and stray
 *  spaces ("a5 " → "A5"). A model that is not on the list is kept as typed: the
 *  list is a hint, not a gate (client, 22.11.2026 — a 2018 Audi A5 and a Range
 *  Rover Sport could not be listed), and every listing is moderated anyway. */
export function canonicalModel(models: string[] | null | undefined, typed: string): string {
  const t = typed.trim().replace(/\s+/g, ' ')
  const key = t.toLowerCase()
  return (models ?? []).find((m) => m.trim().replace(/\s+/g, ' ').toLowerCase() === key)?.trim() ?? t
}
