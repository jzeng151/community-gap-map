'use client'

interface FABProps {
  onClick: () => void
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Report an unmet need"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20
        bg-zinc-900 text-white rounded-full px-5 py-3 text-sm font-semibold
        shadow-lg hover:bg-zinc-700 active:scale-95 transition-all
        md:bottom-8 md:left-auto md:right-8 md:translate-x-0"
    >
      + Report an unmet need
    </button>
  )
}
