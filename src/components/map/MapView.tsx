'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Offering, PulsePost, PROVIDER_COLORS, CATEGORY_LABELS, ProviderType } from '@/types'
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

  // Keep latest data and callbacks in refs so event handlers don't go stale
  const offeringsRef = useRef(offerings)
  useEffect(() => { offeringsRef.current = offerings }, [offerings])
  const onOfferingSelectRef = useRef(onOfferingSelect)
  useEffect(() => { onOfferingSelectRef.current = onOfferingSelect }, [onOfferingSelect])

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

    map.on('load', async () => {
      // --- Load teardrop pin images for each provider type ---
      const providerTypes: ProviderType[] = ['gov', 'npo', 'mutual-aid']
      try {
        await Promise.all(
          providerTypes.map(pt =>
            loadPinImage(PROVIDER_COLORS[pt]).then(img => {
              if (!map.hasImage(`pin-${pt}`)) map.addImage(`pin-${pt}`, img)
            })
          )
        )
      } catch (err) {
        console.error('Failed to load pin images:', err)
        return
      }

      // --- Offerings source ---
      map.addSource('offerings', {
        type: 'geojson',
        data: offeringsToGeoJSON(offeringsRef.current),
      })

      // Single symbol layer — teardrop pin, faded when status is not 'open'
      map.addLayer({
        id: 'offerings-pins',
        type: 'symbol',
        source: 'offerings',
        layout: {
          'icon-image': ['concat', 'pin-', ['get', 'provider_type']],
          'icon-size': 0.9,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
        paint: {
          'icon-opacity': [
            'case',
            ['==', ['get', 'availability_status'], 'open'],
            1,
            0.5,
          ],
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
        if (found) onOfferingSelectRef.current(found)
      }

      map.on('click', 'offerings-pins', handleOfferingClick)

      map.on('click', 'pulse-dots', (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const { category, neighborhood } = feat.properties as { category: string; neighborhood: string }
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
        new mapboxgl.Popup({ closeButton: true, offset: 10 })
          .setLngLat(coords)
          .setHTML(
            `<div style="padding:10px 12px;font-family:inherit">
              <p style="font-weight:600;font-size:13px;margin:0 0 2px">${escapeHtml(CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category)}</p>
              <p style="font-size:12px;color:#71717a;margin:0">${escapeHtml(neighborhood)}</p>
            </div>`
          )
          .addTo(map)
      })

      // Click on empty area: deselect (queryRenderedFeatures guards against racing with pin clicks)
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['offerings-pins'],
        })
        if (features.length === 0) onOfferingSelectRef.current(null)
      })

      // Cursor pointer on hover
      for (const layer of ['offerings-pins', 'pulse-dots', 'pulse-clusters']) {
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
        provider_type: o.provider_type,
        availability_status: o.availability_status,
      },
    })),
  }
}

function pinSvg(color: string): string {
  // Google Maps-style teardrop: rounded top, pointed bottom, white inner circle
  return `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="6" fill="white" opacity="0.9"/>
  </svg>`
}

function loadPinImage(color: string): Promise<HTMLImageElement> {
  const svg = pinSvg(color)
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  return new Promise((resolve, reject) => {
    const img = new Image(28, 40)
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
