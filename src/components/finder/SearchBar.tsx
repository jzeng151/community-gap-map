'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search services, neighborhoods, or zip…' }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync if parent resets the value externally (e.g. clear filters)
  useEffect(() => {
    setInputValue(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setInputValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange(next), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400
          shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
      />
    </div>
  )
}
