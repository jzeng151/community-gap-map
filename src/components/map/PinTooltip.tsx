import { Offering, PROVIDER_LABELS, PROVIDER_COLORS } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface PinTooltipProps {
  offering: Offering
  onClose: () => void
  onFlag: (id: string) => void
}

export function PinTooltip({ offering, onClose, onFlag }: PinTooltipProps) {
  const importedDate = new Date(offering.imported_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-72 bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Color bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: PROVIDER_COLORS[offering.provider_type] }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 text-sm leading-snug">{offering.name}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 flex-shrink-0 -mt-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {offering.address && (
          <p className="text-xs text-zinc-500 mt-1">{offering.address}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${PROVIDER_COLORS[offering.provider_type]}20`,
              color: PROVIDER_COLORS[offering.provider_type],
            }}
          >
            {PROVIDER_LABELS[offering.provider_type]}
          </span>
          <Badge status={offering.availability_status} />
        </div>

        <p className="text-xs text-zinc-400 mt-3">
          Hours as of {importedDate} ·{' '}
          <button
            onClick={() => onFlag(offering.id)}
            className="underline hover:text-zinc-600 cursor-pointer"
          >
            Flag if inaccurate
          </button>
        </p>
      </div>
    </div>
  )
}
