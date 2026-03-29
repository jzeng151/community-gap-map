'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Offering, PulsePost, Category, ProviderType } from '@/types'
import { FAB } from '@/components/ui/FAB'
import { ResultsSidebar } from '@/components/finder/ResultsSidebar'
import { ResultsBottomSheet } from '@/components/finder/ResultsBottomSheet'
import { SearchBar } from '@/components/finder/SearchBar'
import { CategoryChips } from '@/components/finder/CategoryChips'
import { ProviderTypeChips } from '@/components/finder/ProviderTypeChips'
import { AvailabilityToggle } from '@/components/finder/AvailabilityToggle'
import { PulseForm } from '@/components/pulse/PulseForm'

// Mapbox must only run client-side
const MapView = dynamic(
  () => import('@/components/map/MapView').then(m => m.MapView),
  { ssr: false, loading: () => <MapPlaceholder /> }
)

interface MapDashboardProps {
  initialOfferings: Offering[]
  initialPulsePosts: PulsePost[]
}

export function MapDashboard({ initialOfferings, initialPulsePosts }: MapDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedProviders, setSelectedProviders] = useState<ProviderType[]>([])
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null)
  const [showPulseForm, setShowPulseForm] = useState(false)
  const [pulsePosts, setPulsePosts] = useState(initialPulsePosts)

  const filteredOfferings = useMemo(() => {
    let result = initialOfferings

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        o =>
          o.name.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q)
      )
    }

    if (selectedCategories.length > 0) {
      result = result.filter(o => selectedCategories.includes(o.category))
    }

    if (selectedProviders.length > 0) {
      result = result.filter(o => selectedProviders.includes(o.provider_type))
    }

    if (openOnly) {
      result = result.filter(o => o.availability_status === 'open')
    }

    // Sort: open first, then by name
    return result.sort((a, b) => {
      const order = { open: 0, unknown: 1, closed: 2 }
      const diff = order[a.availability_status] - order[b.availability_status]
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    })
  }, [initialOfferings, searchQuery, selectedCategories, selectedProviders, openOnly])

  const handleFlagPulse = useCallback(async (id: string) => {
    try {
      await fetch('/api/pulse/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      // Optimistically hide if flag count reaches threshold (unknown here, just remove from UI)
    } catch {
      // silent — flag can be retried
    }
  }, [])

  const handleFlagOffering = useCallback(async (id: string) => {
    // Flagging an offering for inaccurate hours — future API route
    console.info('Flag offering:', id)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Desktop top bar (hidden on mobile) */}
      <header className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-zinc-100 bg-white z-10 flex-shrink-0">
        <span className="font-semibold text-zinc-900 whitespace-nowrap text-sm">
          NYC Gap Map
        </span>
        <div className="flex-1 max-w-sm">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="relative flex-1">
          {/* Mobile floating search + filter bar */}
          <div className="md:hidden absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <CategoryChips selected={selectedCategories} onChange={setSelectedCategories} />
              <ProviderTypeChips selected={selectedProviders} onChange={setSelectedProviders} />
            </div>
            <AvailabilityToggle checked={openOnly} onChange={setOpenOnly} />
          </div>

          <MapView
            offerings={filteredOfferings}
            pulsePosts={pulsePosts}
            selectedOffering={selectedOffering}
            onOfferingSelect={setSelectedOffering}
            onFlagOffering={handleFlagOffering}
          />
        </div>

        {/* Desktop sidebar */}
        <ResultsSidebar
          offerings={filteredOfferings}
          pulsePosts={pulsePosts}
          selectedOffering={selectedOffering}
          onOfferingSelect={setSelectedOffering}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedProviders={selectedProviders}
          onProvidersChange={setSelectedProviders}
          openOnly={openOnly}
          onOpenOnlyChange={setOpenOnly}
          onFlagPulse={handleFlagPulse}
        />
      </div>

      {/* FAB */}
      <FAB onClick={() => setShowPulseForm(true)} />

      {/* Mobile bottom sheet */}
      <ResultsBottomSheet
        offerings={filteredOfferings}
        pulsePosts={pulsePosts}
        selectedOffering={selectedOffering}
        onOfferingSelect={setSelectedOffering}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        selectedProviders={selectedProviders}
        onProvidersChange={setSelectedProviders}
        openOnly={openOnly}
        onOpenOnlyChange={setOpenOnly}
        showPulseForm={showPulseForm}
        onClosePulseForm={() => setShowPulseForm(false)}
        onFlagPulse={handleFlagPulse}
      />

      {/* Desktop pulse form modal */}
      {showPulseForm && (
        <div className="hidden md:flex fixed inset-0 z-30 items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Report an unmet need</h2>
              <button
                onClick={() => setShowPulseForm(false)}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5">
              <PulseForm onSuccess={() => setShowPulseForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MapPlaceholder() {
  return (
    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
      <p className="text-sm text-zinc-400">Loading map…</p>
    </div>
  )
}
