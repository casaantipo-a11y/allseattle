'use client'

import { useMemo, useState } from 'react'

import { MapClient, type MapPoint } from './MapClient'

export type ExplorerPoint = MapPoint & { categoryIds: number[] }
export type ExplorerCategory = { id: number; name: string; group: string; ids: number[] }

// /map: every business with coordinates, clustered, filtered by category.
// Events join the same map in phase 3 as another group.
export function MapExplorer({ points, categories }: { points: ExplorerPoint[]; categories: ExplorerCategory[] }) {
  const [cat, setCat] = useState<string>('')
  const shown = useMemo(() => {
    if (!cat) return points
    const ids = new Set(categories.find((c) => String(c.id) === cat)?.ids ?? [])
    return points.filter((p) => p.categoryIds.some((id) => ids.has(id)))
  }, [cat, points, categories])

  const groups = [...new Set(categories.map((c) => c.group))]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="field m-0 min-w-[260px]">
          <label htmlFor="map-cat">Category</label>
          <select id="map-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Everything</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {categories
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      {/* Remounting on filter change refits the map to what's left. */}
      <MapClient key={cat || 'all'} points={shown} cluster height={560} />
    </div>
  )
}
