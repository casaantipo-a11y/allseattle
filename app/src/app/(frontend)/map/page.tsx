import type { Metadata } from 'next'

import { SECTIONS } from '@/collections/BusinessCategories'
import { type ExplorerCategory, type ExplorerPoint, MapExplorer } from '@/components/map/MapExplorer'
import { bizPath, effectivePackage, viewFor, withDescendants } from '@/lib/business'
import { getAllBusinesses, getBusinessCategories } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seattle city map',
  description: 'Seattle businesses, shops and places to go on one map, filtered by category.',
  alternates: { canonical: '/map' },
}

export default async function MapPage() {
  const [businesses, categories] = await Promise.all([getAllBusinesses(), getBusinessCategories()])

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

  const sectionLabel = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label]))
  const explorerCategories: ExplorerCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    group: sectionLabel[c.section] ?? 'Other',
    ids: [...withDescendants(categories, c.id)],
  }))

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
