import { AvailabilityStatus } from '@/types'

const STYLES: Record<AvailabilityStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-700',
  unknown: 'bg-zinc-100 text-zinc-500',
}

const LABELS: Record<AvailabilityStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  unknown: 'Unknown',
}

export function Badge({ status }: { status: AvailabilityStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
