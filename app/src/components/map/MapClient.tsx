'use client'

import dynamic from 'next/dynamic'

import type { MapPoint } from './LeafletMap'

// Leaflet touches `window` on import, so the map is loaded in the browser
// only. The placeholder keeps the same height, so nothing jumps when it loads.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="as-map as-map--loading" aria-hidden="true" />,
})

export type { MapPoint }

export function MapClient(props: { points: MapPoint[]; cluster?: boolean; zoom?: number; height?: number }) {
  return (
    <div style={{ minHeight: props.height ?? 360 }}>
      <LeafletMap {...props} />
    </div>
  )
}
