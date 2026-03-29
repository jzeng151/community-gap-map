import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PulseForm } from '@/components/pulse/PulseForm'

// Mock fetch
const mockFetch = vi.fn()
beforeEach(() => {
  global.fetch = mockFetch
  mockFetch.mockClear()
})

describe('PulseForm', () => {
  it('renders category and neighborhood dropdowns', () => {
    render(<PulseForm onSuccess={() => {}} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
  })

  it('submit button disabled when required fields empty', () => {
    render(<PulseForm onSuccess={() => {}} />)
    expect(screen.getByText('Submit anonymously')).toBeDisabled()
  })

  it('honeypot field is hidden from users', () => {
    const { container } = render(<PulseForm onSuccess={() => {}} />)
    const honeypot = container.querySelector('input[name="website"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveClass('opacity-0')
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot).toHaveAttribute('aria-hidden', 'true')
  })

  it('no error messages shown initially', () => {
    render(<PulseForm onSuccess={() => {}} />)
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Try again in an hour/)).not.toBeInTheDocument()
  })

  it('description label clarifies it is not stored publicly', () => {
    render(<PulseForm onSuccess={() => {}} />)
    expect(screen.getByText(/not stored publicly/)).toBeInTheDocument()
  })

  it('renders "Submit anonymously" button text', () => {
    render(<PulseForm onSuccess={() => {}} />)
    expect(screen.getByText('Submit anonymously')).toBeInTheDocument()
  })

  it('renders privacy note about location', () => {
    render(<PulseForm onSuccess={() => {}} />)
    expect(screen.getByText(/never stored/)).toBeInTheDocument()
  })
})
