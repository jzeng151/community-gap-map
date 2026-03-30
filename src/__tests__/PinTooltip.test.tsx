import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PinTooltip } from '@/components/map/PinTooltip'
import type { Offering } from '@/types'

const base: Offering = {
  id: '1',
  name: 'Brooklyn Legal Aid',
  category: 'legal',
  provider_type: 'npo',
  address: '55 Court St, Brooklyn, NY 11201',
  lat: 40.69,
  lng: -73.99,
  hours_json: null,
  services: null,
  availability_status: 'unknown',
  data_source: null,
  imported_at: '2024-03-01T00:00:00Z',
  flagged: false,
}

describe('PinTooltip', () => {
  it('renders offering name', () => {
    render(<PinTooltip offering={base} onClose={() => {}} onFlag={() => {}} />)
    expect(screen.getByText('Brooklyn Legal Aid')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<PinTooltip offering={base} onClose={onClose} onFlag={() => {}} />)
    await userEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onFlag with offering id when flag link clicked', async () => {
    const onFlag = vi.fn()
    render(<PinTooltip offering={base} onClose={() => {}} onFlag={onFlag} />)
    await userEvent.click(screen.getByText('Flag if inaccurate'))
    expect(onFlag).toHaveBeenCalledWith('1')
  })

  it('renders all service chips when services present', () => {
    render(
      <PinTooltip
        offering={{ ...base, services: ['Legal Aid / Intervention', 'Immigration Law'] }}
        onClose={() => {}}
        onFlag={() => {}}
      />
    )
    expect(screen.getByText('Legal Aid / Intervention')).toBeInTheDocument()
    expect(screen.getByText('Immigration Law')).toBeInTheDocument()
  })

  it('renders no service chips when services null', () => {
    render(<PinTooltip offering={base} onClose={() => {}} onFlag={() => {}} />)
    expect(screen.queryByText('Legal Aid / Intervention')).not.toBeInTheDocument()
  })

  it('shows hours when hours_json.text present', () => {
    render(
      <PinTooltip
        offering={{ ...base, hours_json: { text: 'Mon - Fri: 9 AM - 5 PM' } }}
        onClose={() => {}}
        onFlag={() => {}}
      />
    )
    expect(screen.getByText(/Mon - Fri/)).toBeInTheDocument()
    expect(screen.getByText('Hours:')).toBeInTheDocument()
  })

  it('hides hours section when hours_json null', () => {
    render(<PinTooltip offering={base} onClose={() => {}} onFlag={() => {}} />)
    expect(screen.queryByText('Hours:')).not.toBeInTheDocument()
  })

  it('never renders a description field', () => {
    render(<PinTooltip offering={base} onClose={() => {}} onFlag={() => {}} />)
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument()
  })
})
