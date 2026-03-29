'use client'

import { useState } from 'react'
import { Category, CATEGORY_LABELS } from '@/types'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

interface PulseFormProps {
  onSuccess: () => void
}

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'ratelimit'

export function PulseForm({ onSuccess }: PulseFormProps) {
  const [category, setCategory] = useState<Category | ''>('')
  const [description, setDescription] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [honeypot, setHoneypot] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !neighborhood) return

    setFormState('loading')

    try {
      const res = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, neighborhood, _trap: honeypot }),
      })

      if (res.status === 429) {
        setFormState('ratelimit')
        return
      }
      if (!res.ok) {
        setFormState('error')
        return
      }

      setFormState('success')
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch {
      setFormState('error')
    }
  }

  if (formState === 'success') {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-medium text-zinc-900">Your post was submitted anonymously.</p>
        <p className="text-sm text-zinc-500 mt-1">No personal information was collected.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        autoComplete="off"
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as Category)}
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900
            focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Description{' '}
          <span className="text-zinc-400 font-normal">(optional · not stored publicly)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Briefly describe the need (for moderation context only — never shown publicly)"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 resize-none
            placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <p className="text-xs text-zinc-400 mt-1 text-right">{description.length}/280</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Neighborhood <span className="text-red-500">*</span>
        </label>
        <select
          value={neighborhood}
          onChange={e => setNeighborhood(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900
            focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Select a neighborhood…</option>
          {/* NTA list populated from nta-centroids.json once available */}
          <option value="placeholder" disabled className="text-zinc-400 italic">
            Neighborhood list coming soon
          </option>
        </select>
        <p className="text-xs text-zinc-400 mt-1">
          Your location is never stored — only the neighborhood name and a jittered map point.
        </p>
      </div>

      {formState === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Something went wrong. Please try again.
        </p>
      )}
      {formState === 'ratelimit' && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Try again in an hour.
        </p>
      )}

      <button
        type="submit"
        disabled={formState === 'loading' || !category || !neighborhood}
        className="w-full rounded-full bg-zinc-900 text-white py-3 text-sm font-semibold
          hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {formState === 'loading' ? 'Submitting…' : 'Submit anonymously'}
      </button>
    </form>
  )
}
