import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FlagButton } from '@/components/pulse/FlagButton'

describe('FlagButton', () => {
  it('enables click and calls onFlag', async () => {
    const onFlag = vi.fn()
    render(<FlagButton postId="post-1" onFlag={onFlag} />)
    await userEvent.click(screen.getByTitle('Flag this post'))
    expect(onFlag).toHaveBeenCalledWith('post-1')
  })

  it('disables after first click (optimistic UI)', async () => {
    const onFlag = vi.fn()
    render(<FlagButton postId="post-1" onFlag={onFlag} />)
    const btn = screen.getByTitle('Flag this post')
    await userEvent.click(btn)
    // After flagging, button should be disabled
    expect(screen.getByTitle('Flagged for review')).toBeDisabled()
  })

  it('does not call onFlag twice if clicked again after flagging', async () => {
    const onFlag = vi.fn()
    render(<FlagButton postId="post-1" onFlag={onFlag} />)
    await userEvent.click(screen.getByTitle('Flag this post'))
    // Try clicking disabled button
    await userEvent.click(screen.getByTitle('Flagged for review'))
    expect(onFlag).toHaveBeenCalledOnce()
  })
})
