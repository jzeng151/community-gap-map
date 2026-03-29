'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Offering, PulsePost, PROVIDER_COLORS, CATEGORY_LABELS } from '@/types'
import { Legend } from './Legend'
import { PinTooltip } from './PinTooltip'

interface MapViewProps {
  offerings: Offering[]
  pulsePosts: PulsePost[]
  selectedOffering: Offering | null
  onOfferingSelect: (offering: Offering | null) => void
  onFlagOffering: (id: string) => void
}

export function MapView({
  offerings,
  pulsePosts,
  selectedOffering,
  onOfferingSelect,
  onFlagOffering,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  // Keep latest data in refs so event handlers don't go stale
  const offeringsRef = useRef(offerings)
  useEffect(() => { offeringsRef.current = offerings }, [offerings])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.985, 40.748], // NYC midtown
      zoom: 11,
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    map.on('load', () => {
      // --- Offerings source ---
      map.addSource('offerings', {
        type: 'geojson',
        data: offeringsToGeoJSON(offeringsRef.current),
      })

      // Closed / unknown: faded fill + colored stroke
      map.addLayer({
        id: 'offerings-inactive',
        type: 'circle',
        source: 'offerings',
        filter: ['!=', ['get', 'availability_status'], 'open'],
        paint: {
          'circle-radius': 7,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.7,
        },
      })

      // Open: full color
      map.addLayer({
        id: 'offerings-active',
        type: 'circle',
        source: 'offerings',
        filter: ['==', ['get', 'availability_status'], 'open'],
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-opacity': 1,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1,
        },
      })

      // --- Pulse source with clustering ---
      map.addSource('pulse', {
        type: 'geojson',
        data: pulseToGeoJSON(pulsePosts),
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 40,
      })

      // Cluster bubbles
      map.addLayer({
        id: 'pulse-clusters',
        type: 'circle',
        source: 'pulse',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#a855f7',
          'circle-opacity': 0.55,
          'circle-radius': [
            'step', ['get', 'point_count'],
            14, 5,
            18, 15,
            24,
          ],
        },
      })

      // Cluster count label
      map.addLayer({
        id: 'pulse-cluster-count',
        type: 'symbol',
        source: 'pulse',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 11,
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual pulse dots
      map.addLayer({
        id: 'pulse-dots',
        type: 'circle',
        source: 'pulse',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 6,
          'circle-color': '#a855f7',
          'circle-opacity': 0.5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#a855f7',
          'circle-stroke-opacity': 0.8,
        },
      })

      // --- Click handlers ---
      const handleOfferingClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
        const feat = e.features?.[0]
        if (!feat) return
        const id = feat.properties?.id as string
        const found = offeringsRef.current.find(o => o.id === id)
        if (found) onOfferingSelect(found)
      }

      map.on('click', 'offerings-active', handleOfferingClick)
      map.on('click', 'offerings-inactive', handleOfferingClick)

      map.on('click', 'pulse-dots', (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const { category, neighborhood } = feat.properties as { category: string; neighborhood: string }
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
        new mapboxgl.Popup({ closeButton: true, offset: 10 })
          .setLngLat(coords)
          .setHTML(
            `<div style="padding:10px 12px;font-family:inherit">
              <p style="font-weight:600;font-size:13px;margin:0 0 2px">${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}</p>
              <p style="font-size:12px;color:#71717a;margin:0">${neighborhood}</p>
            </div>`
          )
          .addTo(map)
      })

      // Click on empty area: deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['offerings-active', 'offerings-inactive'],
        })
        if (features.length === 0) onOfferingSelect(null)
      })

      // Cursor pointer on hover
      for (const layer of ['offerings-active', 'offerings-inactive', 'pulse-dots', 'pulse-clusters']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update offerings source when filtered data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = () => {
      const src = map.getSource('offerings') as mapboxgl.GeoJSONSource | undefined
      src?.setData(offeringsToGeoJSON(offerings))
    }
    if (map.isStyleLoaded()) update()
    else map.once('load', update)
  }, [offerings])

  // Update pulse source when posts change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = () => {
      const src = map.getSource('pulse') as mapboxgl.GeoJSONSource | undefined
      src?.setData(pulseToGeoJSON(pulsePosts))
    }
    if (map.isStyleLoaded()) update()
    else map.once('load', update)
  }, [pulsePosts])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <Legend />
      {selectedOffering && (
        <PinTooltip
          offering={selectedOffering}
          onClose={() => onOfferingSelect(null)}
          onFlag={onFlagOffering}
        />
      )}
    </div>
  )
}

function offeringsToGeoJSON(offerings: Offering[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: offerings.map(o => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
      properties: {
        id: o.id,
        color: PROVIDER_COLORS[o.provider_type],
        availability_status: o.availability_status,
      },
    })),
  }
}

function pulseToGeoJSON(posts: PulsePost[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: posts.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        category: p.category,
        neighborhood: p.neighborhood,
      },
    })),
  }
}
