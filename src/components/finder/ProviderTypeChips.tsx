'use client'

import { ProviderType, PROVIDER_LABELS } from '@/types'
import { Chip } from '@/components/ui/Chip'

const PROVIDERS = Object.keys(PROVIDER_LABELS) as ProviderType[]

interface ProviderTypeChipsProps {
  selected: ProviderType[]
  onChange: (selected: ProviderType[]) => void
}

export function ProviderTypeChips({ selected, onChange }: ProviderTypeChipsProps) {
  function toggle(pt: ProviderType) {
    if (selected.includes(pt)) {
      onChange(selected.filter(p => p !== pt))
    } else {
      onChange([...selected, pt])
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {PROVIDERS.map(pt => (
        <Chip
          key={pt}
          label={PROVIDER_LABELS[pt]}
          selected={selected.includes(pt)}
          onClick={() => toggle(pt)}
        />
      ))}
    </div>
  )
}
