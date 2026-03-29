import { PROVIDER_COLORS, PROVIDER_LABELS, ProviderType } from '@/types'

export function Legend() {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-md p-3 text-xs pointer-events-none">
      <p className="font-semibold text-zinc-700 mb-2">Provider</p>
      {(Object.entries(PROVIDER_LABELS) as [ProviderType, string][]).map(([type, label]) => (
        <div key={type} className="flex items-center gap-2 mb-1.5">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: PROVIDER_COLORS[type] }}
          />
          <span className="text-zinc-600">{label}</span>
        </div>
      ))}

      <div className="border-t border-zinc-100 mt-2 pt-2">
        <p className="font-semibold text-zinc-700 mb-1">Hours</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-zinc-400 flex-shrink-0" />
          <span className="text-zinc-600">Open per listed</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-zinc-200 border border-zinc-400 flex-shrink-0" />
          <span className="text-zinc-600">Closed / Unknown</span>
        </div>
      </div>

      <div className="border-t border-zinc-100 mt-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-400 opacity-60 flex-shrink-0" />
          <span className="text-zinc-600">Unmet need</span>
        </div>
      </div>
    </div>
  )
}
