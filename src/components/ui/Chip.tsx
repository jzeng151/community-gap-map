'use client'

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer
        ${selected
          ? 'bg-zinc-900 text-white border-zinc-900'
          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
        }`}
    >
      {label}
    </button>
  )
}
