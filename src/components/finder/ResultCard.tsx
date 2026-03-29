import { Offering, PROVIDER_LABELS, PROVIDER_COLORS } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ResultCardProps {
  offering: Offering
  selected: boolean
  onClick: () => void
  distanceKm?: number
}

export function ResultCard({ offering, selected, onClick, distanceKm }: ResultCardProps) {
  const importedDate = new Date(offering.imported_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors
        ${selected ? 'bg-zinc-50 border-l-2' : ''}
      `}
      style={selected ? { borderLeftColor: PROVIDER_COLORS[offering.provider_type] } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-zinc-900 text-sm leading-snug">{offering.name}</h4>
        <Badge status={offering.availability_status} />
      </div>

      {offering.address && (
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{offering.address}</p>
      )}

      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-xs font-medium rounded-full px-2 py-0.5"
          style={{
            backgroundColor: `${PROVIDER_COLORS[offering.provider_type]}18`,
            color: PROVIDER_COLORS[offering.provider_type],
          }}
        >
          {PROVIDER_LABELS[offering.provider_type]}
        </span>
        {distanceKm !== undefined && (
          <span className="text-xs text-zinc-400">
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 mt-1.5">Hours as of {importedDate}</p>
    </button>
  )
}
