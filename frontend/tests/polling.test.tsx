import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePolling } from '../src/hooks/usePolling'

interface HarnessProps {
  callback: () => void
  intervalMs?: number
}

function Harness({ callback, intervalMs = 3000 }: HarnessProps) {
  usePolling(callback, intervalMs)
  return null
}

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs the callback once per interval', () => {
    const callback = vi.fn()
    render(<Harness callback={callback} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(callback).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('does not restart the timer when the component re-renders with a new callback', () => {
    const first = vi.fn()
    const { rerender } = render(<Harness callback={first} />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(first).not.toHaveBeenCalled()

    const second = vi.fn()
    act(() => {
      rerender(<Harness callback={second} />)
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('clears the interval on unmount so no timer survives', () => {
    const callback = vi.fn()
    const { unmount } = render(<Harness callback={callback} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      unmount()
    })

    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
