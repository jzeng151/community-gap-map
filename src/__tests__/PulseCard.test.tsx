import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PulseCard } from '@/components/pulse/PulseCard'
import type { PulsePost } from '@/types'

const mockPost: PulsePost = {
  id: 'abc-123',
  category: 'food',
  neighborhood: 'Bed-Stuy',
  lat: 40.68,
  lng: -73.94,
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  flag_count: 0,
  status: 'visible',
}

describe('PulseCard', () => {
  it('renders category label', () => {
    render(<PulseCard post={mockPost} onFlag={() => {}} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('renders neighborhood name', () => {
    render(<PulseCard post={mockPost} onFlag={() => {}} />)
    expect(screen.getByText('Bed-Stuy')).toBeInTheDocument()
  })

  it('shows time ago', () => {
    render(<PulseCard post={mockPost} onFlag={() => {}} />)
    expect(screen.getByText(/5m ago/)).toBeInTheDocument()
  })

  it('does not render description (anonymity guarantee)', () => {
    // description is never passed to PulseCard — verify no description field
    const { container } = render(<PulseCard post={mockPost} onFlag={() => {}} />)
    // The card should only show category, neighborhood, time — nothing else
    expect(container.textContent).not.toContain('description')
  })

  it('calls onFlag when flag button clicked', async () => {
    const onFlag = vi.fn()
    render(<PulseCard post={mockPost} onFlag={onFlag} />)
    await userEvent.click(screen.getByTitle('Flag this post'))
    expect(onFlag).toHaveBeenCalledWith('abc-123')
  })
})
