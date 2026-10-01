import type { Metadata } from 'next'

import { SECTIONS } from '@/collections/BusinessCategories'
import { type ExplorerCategory, type ExplorerPoint, MapExplorer } from '@/components/map/MapExplorer'
import { bizPath, effectivePackage, viewFor, withDescendants } from '@/lib/business'
import { dateParts } from '@/lib/events'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'
import { getEventCategories, getUpcomingEvents } from '@/lib/queries-phase3'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seattle city map',
  description: 'Seattle businesses, shops, places to go and upcoming events on one map, filtered by category.',
  alternates: { canonical: '/map' },
}

export default async function MapPage() {
  const [businesses, categories, events, eventCats] = await Promise.all([
    getAllBusinesses(),
    getBusinessCategories(),
    getUpcomingEvents(),
    getEventCategories(),
  ])

  const points: ExplorerPoint[] = businesses
    .filter((b) => b.lat != null && b.lng != null)
    .filter((b) => {
      const pkg = effectivePackage(b)
      return pkg ? pkg.mapPlacement : true
    })
    .map((b) => {
      const cats = (b.categories ?? []).filter((c) => typeof c === 'object')
      return {
        id: String(b.id),
        lat: b.lat as number,
        lng: b.lng as number,
        title: b.name,
        href: bizPath(b.slug),
        subtitle: [cats.map((c) => c.name).join(', '), b.address].filter(Boolean).join(' — '),
        kind: viewFor(effectivePackage(b)),
        categoryIds: cats.map((c) => c.id),
      }
    })

  // Events share the map; their category ids are negated so they can't
  // collide with business category ids in the filter.
  const eventPoints: ExplorerPoint[] = events
    .filter((e) => e.lat != null && e.lng != null)
    .map((e) => {
      const cat = typeof e.category === 'object' ? e.category : null
      const d = dateParts(e.startAt)
      return {
        id: `ev-${e.id}`,
        lat: e.lat as number,
        lng: e.lng as number,
        title: e.title,
        href: `/events/${e.slug}`,
        subtitle: `${d.weekday} ${d.month} ${d.day}, ${d.time} — ${e.venueName}`,
        kind: 'event' as const,
        categoryIds: cat ? [-cat.id, -1_000_000] : [-1_000_000],
      }
    })
  points.push(...eventPoints)

  const sectionLabel = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label]))
  const explorerCategories: ExplorerCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    group: sectionLabel[c.section] ?? 'Other',
    ids: [...withDescendants(categories, c.id)],
  }))
  if (eventPoints.length) {
    explorerCategories.push({ id: -1_000_000, name: 'All events', group: 'Events', ids: [-1_000_000] })
    for (const c of eventCats) explorerCategories.push({ id: -c.id, name: c.name, group: 'Events', ids: [-c.id] })
  }

  return (
    <main id="content" data-page="map">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Neighborhood guide</span>
              <h1>City map</h1>
            </div>
          </div>
          <MapExplorer points={points} categories={explorerCategories} />
        </div>
      </section>
    </main>
  )
}
