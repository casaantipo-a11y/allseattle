'use client'

import { type ReactNode, useMemo, useState } from 'react'

import { MapClient, type MapPoint } from './MapClient'

export type ExplorerPoint = MapPoint & { categoryIds: number[] }
export type ExplorerCategory = { id: number; name: string; group: string; ids: number[]; depth?: number }

// /map: every business with coordinates, clustered, filtered by category.
// Events join the same map in phase 3 as another group.
const LEGEND = [
  { kind: 'premium', label: 'Premium business' },
  { kind: 'luxury', label: 'Lux business' },
  { kind: 'standard', label: 'Business' },
  { kind: 'event', label: 'Event' },
] as const

export function MapExplorer({
  points,
  categories,
  head,
}: {
  points: ExplorerPoint[]
  categories: ExplorerCategory[]
  /** The page's eyebrow + heading; the filter sits in the same row, centred. */
  head: ReactNode
}) {
  const [cat, setCat] = useState<string>('')
  const shown = useMemo(() => {
    if (!cat) return points
    const ids = new Set(categories.find((c) => String(c.id) === cat)?.ids ?? [])
    return points.filter((p) => p.categoryIds.some((id) => ids.has(id)))
  }, [cat, points, categories])

  const groups = [...new Set(categories.map((c) => c.group))]

  return (
    <>
      {/* Heading on the left, the pin legend in the middle of the page, the category
          filter at the right edge; the map 10px under the heading, as the blocks on
          Shopping (client, 05.10.2026). Layout in business.css (.map-head). */}
      <div className="section-head map-head">
        {head}
        <div className="field map-filter">
          {/* The label is for screen readers: in the heading row a visible "Category" made
              the control taller than the heading and pushed it into the map. */}
          <label htmlFor="map-cat" className="sr-only">
            Category
          </label>
          <select id="map-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {categories
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {/* Subcategories indented under their parent (no CSS reaches into <option>). */}
                      {'\u2003'.repeat(c.depth ?? 0)}
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        {/* What the pin colours mean, for the kinds actually on the map — in the heading
            row, centred on the page (client, 05.10.2026). */}
        <ul className="map-legend" aria-label="Map legend">
          {LEGEND.filter((l) => shown.some((p) => p.kind === l.kind)).map((l) => (
            <li key={l.kind}>
              <span className={`as-pin as-pin--${l.kind}`} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="map-body">
        {/* Remounting on filter change refits the map to what's left. */}
        <MapClient key={cat || 'all'} points={shown} cluster height={560} />
      </div>
    </>
  )
}
