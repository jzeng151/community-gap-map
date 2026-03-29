'use client'

import { useRef } from 'react'

export type SheetState = 'collapsed' | 'half' | 'full'

interface BottomSheetProps {
  state: SheetState
  onStateChange: (state: SheetState) => void
  children: React.ReactNode
}

const HEIGHTS: Record<SheetState, string> = {
  collapsed: '15vh',
  half: '60vh',
  full: '95vh',
}

const NEXT_STATE: Record<SheetState, SheetState> = {
  collapsed: 'half',
  half: 'full',
  full: 'collapsed',
}

export function BottomSheet({ state, onStateChange, children }: BottomSheetProps) {
  const startY = useRef<number>(0)

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = startY.current - e.changedTouches[0].clientY
    if (delta > 40) {
      // swipe up
      if (state === 'collapsed') onStateChange('half')
      else if (state === 'half') onStateChange('full')
    } else if (delta < -40) {
      // swipe down
      if (state === 'full') onStateChange('half')
      else if (state === 'half') onStateChange('collapsed')
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 flex flex-col"
      style={{ height: HEIGHTS[state] }}
    >
      {/* Handle */}
      <div
        className="flex justify-center pt-3 pb-2 cursor-pointer flex-shrink-0"
        onClick={() => onStateChange(NEXT_STATE[state])}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-zinc-300 rounded-full" />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}
