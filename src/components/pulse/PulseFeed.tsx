import { PulsePost } from '@/types'
import { PulseCard } from './PulseCard'

interface PulseFeedProps {
  posts: PulsePost[]
  onFlag: (id: string) => void
}

export function PulseFeed({ posts, onFlag }: PulseFeedProps) {
  if (posts.length === 0) return null

  return (
    <div>
      {posts.map(post => (
        <PulseCard key={post.id} post={post} onFlag={onFlag} />
      ))}
    </div>
  )
}
