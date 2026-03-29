'use client'

import { useState } from 'react'
import { Offering, PulsePost, Category, ProviderType } from '@/types'
import { BottomSheet, SheetState } from '@/components/ui/BottomSheet'
import { SearchBar } from './SearchBar'
import { CategoryChips } from './CategoryChips'
import { ProviderTypeChips } from './ProviderTypeChips'
import { AvailabilityToggle } from './AvailabilityToggle'
import { ResultCard } from './ResultCard'
import { PulseFeed } from '@/components/pulse/PulseFeed'
import { PulseForm } from '@/components/pulse/PulseForm'

interface ResultsBottomSheetProps {
  offerings: Offering[]
  pulsePosts: PulsePost[]
  selectedOffering: Offering | null
  onOfferingSelect: (offering: Offering | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategories: Category[]
  onCategoriesChange: (cats: Category[]) => void
  selectedProviders: ProviderType[]
  onProvidersChange: (pts: ProviderType[]) => void
  openOnly: boolean
  onOpenOnlyChange: (v: boolean) => void
  showPulseForm: boolean
  onClosePulseForm: () => void
  onFlagPulse: (id: string) => void
}

export function ResultsBottomSheet({
  offerings,
  pulsePosts,
  selectedOffering,
  onOfferingSelect,
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  selectedProviders,
  onProvidersChange,
  openOnly,
  onOpenOnlyChange,
  showPulseForm,
  onClosePulseForm,
  onFlagPulse,
}: ResultsBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')

  // Opening pulse form forces full sheet
  const effectiveState: SheetState = showPulseForm ? 'full' : sheetState

  return (
    <div className="md:hidden">
      <BottomSheet state={effectiveState} onStateChange={setSheetState}>
        {showPulseForm ? (
          <div className="px-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900">Report an unmet need</h2>
              <button
                onClick={onClosePulseForm}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>
            <PulseForm onSuccess={onClosePulseForm} />
          </div>
        ) : (
          <>
            {/* Compact filter bar visible in half state */}
            <div className="px-4 pb-3 flex flex-col gap-2">
              <SearchBar value={searchQuery} onChange={onSearchChange} />
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                <CategoryChips selected={selectedCategories} onChange={onCategoriesChange} />
                <ProviderTypeChips selected={selectedProviders} onChange={onProvidersChange} />
              </div>
              <AvailabilityToggle checked={openOnly} onChange={onOpenOnlyChange} />
            </div>

            {/* Results */}
            {offerings.length === 0 ? (
              <p className="px-4 py-4 text-sm text-zinc-400">No services match your filters.</p>
            ) : (
              offerings.map(o => (
                <ResultCard
                  key={o.id}
                  offering={o}
                  selected={selectedOffering?.id === o.id}
                  onClick={() => onOfferingSelect(selectedOffering?.id === o.id ? null : o)}
                />
              ))
            )}

            {pulsePosts.length > 0 && (
              <div className="border-t border-zinc-100 mt-2">
                <p className="px-4 pt-3 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Community Needs
                </p>
                <PulseFeed posts={pulsePosts} onFlag={onFlagPulse} />
              </div>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  )
}
