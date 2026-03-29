'use client'

interface AvailabilityToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function AvailabilityToggle({ checked, onChange }: AvailabilityToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </div>
      <span className="text-sm font-medium text-zinc-700 whitespace-nowrap">
        Open per listed hours
      </span>
    </label>
  )
}
