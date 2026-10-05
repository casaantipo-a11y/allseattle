'use client'

import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

import L from 'leaflet'
import Link from 'next/link'
import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'

// OpenStreetMap through react-leaflet (spec §1). Markers are CSS-drawn
// divIcons (styles/business.css) rather than Leaflet's PNG pins, whose image
// paths break under a bundler. No animations, like the prototype's map.

export type MapPoint = {
  id: string
  lat: number
  lng: number
  title: string
  href?: string
  subtitle?: string
  kind?: 'premium' | 'luxury' | 'standard' | 'event'
}

const SEATTLE: [number, number] = [47.6062, -122.3321]

const icon = (kind: MapPoint['kind'] = 'standard') =>
  L.divIcon({ className: `as-pin as-pin--${kind}`, iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] })

export default function LeafletMap({
  points,
  cluster = false,
  zoom = 12,
  height = 360,
}: {
  points: MapPoint[]
  cluster?: boolean
  zoom?: number
  height?: number
}) {
  const center: [number, number] = points.length === 1 ? [points[0].lat, points[0].lng] : SEATTLE
  const bounds = useMemo(
    () => (points.length > 1 ? L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.1) : undefined),
    [points],
  )

  const markers = points.map((p) => (
    <Marker key={p.id} position={[p.lat, p.lng]} icon={icon(p.kind)} title={p.title}>
      <Popup>
        <strong>{p.href ? <Link href={p.href}>{p.title}</Link> : p.title}</strong>
        {p.subtitle ? <div>{p.subtitle}</div> : null}
      </Popup>
    </Marker>
  ))

  return (
    <MapContainer
      // react-leaflet uses center+zoom when both are given and ignores bounds, so they go
      // in only without bounds (0 or 1 point). Passing them always kept every map on the
      // fixed Seattle view: the set was never fitted, edge pins were cut off, and after a
      // category filter the remaining places could sit outside the frame.
      center={bounds ? undefined : center}
      zoom={bounds ? undefined : points.length === 1 ? 15 : zoom}
      bounds={bounds}
      // Pixel padding on top of the 10% geographic one: pins and cluster badges are up to
      // 40px wide, and without it the ones at the edge of the set were cut in half.
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
      style={{ height, width: '100%' }}
      className="as-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cluster ? (
        <MarkerClusterGroup chunkedLoading animate={false} showCoverageOnHover={false}>
          {markers}
        </MarkerClusterGroup>
      ) : (
        markers
      )}
    </MapContainer>
  )
}
