import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders Open badge with green styles', () => {
    render(<Badge status="open" />)
    const badge = screen.getByText('Open')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('green')
  })

  it('renders Closed badge with red styles', () => {
    render(<Badge status="closed" />)
    const badge = screen.getByText('Closed')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('red')
  })

  it('renders Unknown badge with gray styles', () => {
    render(<Badge status="unknown" />)
    const badge = screen.getByText('Unknown')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('zinc')
  })
})
