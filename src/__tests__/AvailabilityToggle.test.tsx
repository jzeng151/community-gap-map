import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AvailabilityToggle } from '@/components/finder/AvailabilityToggle'

describe('AvailabilityToggle', () => {
  it('renders with exact label "Open per listed hours"', () => {
    render(<AvailabilityToggle checked={false} onChange={() => {}} />)
    expect(screen.getByText('Open per listed hours')).toBeInTheDocument()
  })

  it('calls onChange when toggled', async () => {
    const onChange = vi.fn()
    render(<AvailabilityToggle checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('reflects checked state', () => {
    render(<AvailabilityToggle checked={true} onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
