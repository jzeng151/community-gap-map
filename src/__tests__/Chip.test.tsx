import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Chip } from '@/components/ui/Chip'

describe('Chip', () => {
  it('renders label', () => {
    render(<Chip label="Food" selected={false} onClick={() => {}} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('shows selected state with dark background', () => {
    render(<Chip label="Food" selected={true} onClick={() => {}} />)
    expect(screen.getByText('Food').className).toContain('bg-zinc-900')
  })

  it('shows unselected state with white background', () => {
    render(<Chip label="Food" selected={false} onClick={() => {}} />)
    expect(screen.getByText('Food').className).toContain('bg-white')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Chip label="Food" selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByText('Food'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
