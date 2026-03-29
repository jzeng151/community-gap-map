import { PulsePost, CATEGORY_LABELS } from '@/types'
import { FlagButton } from './FlagButton'

interface PulseCardProps {
  post: PulsePost
  onFlag: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function PulseCard({ post, onFlag }: PulseCardProps) {
  return (
    <div className="px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
            {CATEGORY_LABELS[post.category]}
          </span>
          <p className="text-sm text-zinc-700 mt-1">{post.neighborhood}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(post.created_at)}</p>
        </div>
        <FlagButton postId={post.id} onFlag={onFlag} />
      </div>
    </div>
  )
}
