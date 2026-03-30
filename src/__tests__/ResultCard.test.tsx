import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ResultCard } from '@/components/finder/ResultCard'
import type { Offering } from '@/types'

const base: Offering = {
  id: '1',
  name: 'Test Food Bank',
  category: 'food',
  provider_type: 'npo',
  address: '123 Main St, Brooklyn, NY 11201',
  lat: 40.7,
  lng: -74.0,
  hours_json: null,
  services: null,
  availability_status: 'unknown',
  data_source: null,
  imported_at: '2024-01-15T00:00:00Z',
  flagged: false,
}

describe('ResultCard', () => {
  it('renders offering name', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} />)
    expect(screen.getByText('Test Food Bank')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ResultCard offering={base} selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows address when present', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} />)
    expect(screen.getByText('123 Main St, Brooklyn, NY 11201')).toBeInTheDocument()
  })

  it('hides address when null', () => {
    render(<ResultCard offering={{ ...base, address: null }} selected={false} onClick={() => {}} />)
    expect(screen.queryByText(/Main St/)).not.toBeInTheDocument()
  })

  it('shows service chip when services present', () => {
    render(
      <ResultCard
        offering={{ ...base, services: ['Soup Kitchen / Food Pantry'] }}
        selected={false}
        onClick={() => {}}
      />
    )
    expect(screen.getByText('Soup Kitchen / Food Pantry')).toBeInTheDocument()
  })

  it('hides service chip when services null', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} />)
    // Only provider label chip should show, no service chip
    expect(screen.queryByText('Soup Kitchen / Food Pantry')).not.toBeInTheDocument()
  })

  it('shows hours when hours_json.text present', () => {
    render(
      <ResultCard
        offering={{ ...base, hours_json: { text: 'Mon - Fri: 9 AM - 5 PM' } }}
        selected={false}
        onClick={() => {}}
      />
    )
    expect(screen.getByText(/Mon - Fri/)).toBeInTheDocument()
    expect(screen.getByText('Hours:')).toBeInTheDocument()
  })

  it('shows updated date when no hours', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} />)
    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('formats distance under 1km as meters', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} distanceKm={0.35} />)
    expect(screen.getByText('350m')).toBeInTheDocument()
  })

  it('formats distance 1km+ with one decimal', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} distanceKm={2.7} />)
    expect(screen.getByText('2.7km')).toBeInTheDocument()
  })

  it('hides distance when not provided', () => {
    render(<ResultCard offering={base} selected={false} onClick={() => {}} />)
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\dm$/)).not.toBeInTheDocument()
  })
})
