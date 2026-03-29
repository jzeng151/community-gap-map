'use client'

import { Category, CATEGORY_LABELS } from '@/types'
import { Chip } from '@/components/ui/Chip'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

interface CategoryChipsProps {
  selected: Category[]
  onChange: (selected: Category[]) => void
}

export function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  function toggle(cat: Category) {
    if (selected.includes(cat)) {
      onChange(selected.filter(c => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {CATEGORIES.map(cat => (
        <Chip
          key={cat}
          label={CATEGORY_LABELS[cat]}
          selected={selected.includes(cat)}
          onClick={() => toggle(cat)}
        />
      ))}
    </div>
  )
}
