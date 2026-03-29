import { Offering } from '@/types'
import { ResultCard } from './ResultCard'
import { SearchBar } from './SearchBar'
import { CategoryChips } from './CategoryChips'
import { ProviderTypeChips } from './ProviderTypeChips'
import { AvailabilityToggle } from './AvailabilityToggle'
import { Category, ProviderType } from '@/types'
import { PulseFeed } from '@/components/pulse/PulseFeed'
import { PulsePost } from '@/types'

interface ResultsSidebarProps {
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
  onFlagPulse: (id: string) => void
}

export function ResultsSidebar({
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
  onFlagPulse,
}: ResultsSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 h-full bg-white border-l border-zinc-100 overflow-hidden">
      {/* Search + filters */}
      <div className="p-4 border-b border-zinc-100 flex flex-col gap-3">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
        <div className="overflow-x-auto scrollbar-none">
          <CategoryChips selected={selectedCategories} onChange={onCategoriesChange} />
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <ProviderTypeChips selected={selectedProviders} onChange={onProvidersChange} />
        </div>
        <AvailabilityToggle checked={openOnly} onChange={onOpenOnlyChange} />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {offerings.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-400">
            No services match your filters.
          </div>
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

        {/* Pulse feed */}
        {pulsePosts.length > 0 && (
          <div className="border-t border-zinc-100 mt-2">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Community Needs
            </p>
            <PulseFeed posts={pulsePosts} onFlag={onFlagPulse} />
          </div>
        )}
      </div>
    </aside>
  )
}
