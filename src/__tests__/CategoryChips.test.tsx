import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CategoryChips } from '@/components/finder/CategoryChips'
import type { Category } from '@/types'

describe('CategoryChips', () => {
  it('renders all 6 categories', () => {
    render(<CategoryChips selected={[]} onChange={() => {}} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Housing')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('Childcare')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
  })

  it('adds category when clicking unselected chip', async () => {
    const onChange = vi.fn()
    render(<CategoryChips selected={[]} onChange={onChange} />)
    await userEvent.click(screen.getByText('Food'))
    expect(onChange).toHaveBeenCalledWith(['food'])
  })

  it('removes category when clicking selected chip', async () => {
    const onChange = vi.fn()
    const selected: Category[] = ['food', 'housing']
    render(<CategoryChips selected={selected} onChange={onChange} />)
    await userEvent.click(screen.getByText('Food'))
    expect(onChange).toHaveBeenCalledWith(['housing'])
  })

  it('supports multi-select (OR logic)', async () => {
    const onChange = vi.fn()
    render(<CategoryChips selected={['food']} onChange={onChange} />)
    await userEvent.click(screen.getByText('Jobs'))
    expect(onChange).toHaveBeenCalledWith(['food', 'jobs'])
  })
})
