'use client'

import { useState } from 'react'

interface FlagButtonProps {
  postId: string
  onFlag: (id: string) => void
}

export function FlagButton({ postId, onFlag }: FlagButtonProps) {
  const [flagged, setFlagged] = useState(false)

  function handleClick() {
    if (flagged) return
    setFlagged(true)
    onFlag(postId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={flagged}
      title={flagged ? 'Flagged for review' : 'Flag this post'}
      className={`text-xs transition-colors ${
        flagged
          ? 'text-zinc-300 cursor-default'
          : 'text-zinc-400 hover:text-red-400 cursor-pointer'
      }`}
    >
      ⚑
    </button>
  )
}
