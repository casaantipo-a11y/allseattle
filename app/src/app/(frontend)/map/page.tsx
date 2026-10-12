import type { Metadata } from 'next'

import { SECTIONS } from '@/collections/BusinessCategories'
import { AdSlot } from '@/components/AdSlot'
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

  // The filter lists the sections in site order (Directory, Shopping, Leisure), each
  // section's top-level categories by their admin `order` then A–Z, and subcategories
  // right under their parent, indented — as the Directory's own list does. Before, the
  // raw list put "Car Repair" among unrelated top-level categories and Leisure first.
  const sectionLabel = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label]))
  const sectionRank = Object.fromEntries(SECTIONS.map((s, i) => [s.value, i]))
  const parentId = (c: (typeof categories)[number]) => (c.parent && typeof c.parent === 'object' ? c.parent.id : (c.parent ?? null))
  const byName = (a: (typeof categories)[number], b: (typeof categories)[number]) =>
    (sectionRank[a.section] ?? 99) - (sectionRank[b.section] ?? 99) || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
  const ordered: { cat: (typeof categories)[number]; depth: number }[] = []
  const walk = (parent: number | null, depth: number) => {
    for (const c of categories.filter((x) => parentId(x) === parent).sort(byName)) {
      ordered.push({ cat: c, depth })
      walk(c.id, depth + 1)
    }
  }
  walk(null, 0)
  const explorerCategories: ExplorerCategory[] = ordered.map(({ cat: c, depth }) => ({
    id: c.id,
    name: c.name,
    depth,
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
          {/* The prototype's City Map had a top banner; it is back (client, 07.10.2026). */}
          <AdSlot code="MAP_TOP" size="728x90" mobileSize="320x100" className="ad-slot-top" />
          <MapExplorer
            points={points}
            categories={explorerCategories}
            head={
              <div key="head">
                <span className="eyebrow">Neighborhood guide</span>
                <h1>City map</h1>
              </div>
            }
          />
          {/* B2 under the main content ("other sections" scheme, 12.10.2026). */}
          <AdSlot code="MAP_INFEED_1" size="728x90" mobileSize="320x100" className="ad-slot-under" />
        </div>
      </section>
    </main>
  )
}
