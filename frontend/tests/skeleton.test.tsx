import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job } from '../src/types'

const { useJobsMock } = vi.hoisted(() => ({ useJobsMock: vi.fn() }))

vi.mock('../src/state/jobs', () => ({ useJobs: useJobsMock }))

import { JobList } from '../src/components/JobList'
import { SkeletonRow } from '../src/components/SkeletonRow'

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    text: 'drei kleine Wörter',
    analysis: 'word_count',
    status: 'done',
    result: { words: 3 },
    error: null,
    created_at: '2026-10-08T12:00:00Z',
    updated_at: '2026-10-08T12:00:01Z',
    ...overrides,
  }
}

function setState(
  jobs: Job[],
  loading: boolean,
  error: string | null = null,
): void {
  useJobsMock.mockReturnValue({
    jobs,
    loading,
    error,
    createJob: vi.fn(),
    refresh: vi.fn(),
  })
}

beforeEach(() => {
  useJobsMock.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('SkeletonRow', () => {
  it('renders three stacked bars by default', () => {
    const { container } = render(<SkeletonRow />)

    expect(container.querySelectorAll('.skeleton-bar').length).toBe(3)
  })
})

describe('JobList initial loading skeleton', () => {
  it('shows skeleton placeholders during the initial load', () => {
    setState([], true)

    const { container } = render(<JobList />)

    expect(container.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0)
    expect(container.querySelector('.job-list')?.getAttribute('aria-busy')).toBe(
      'true',
    )
    expect(screen.queryByText('Noch keine Aufträge')).toBeNull()
  })

  it('replaces the skeletons with the real jobs once the first poll returns', () => {
    setState([], true)
    const { container, rerender } = render(<JobList />)
    expect(container.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0)

    setState([makeJob()], false)
    rerender(<JobList />)

    expect(container.querySelectorAll('.skeleton-card').length).toBe(0)
    expect(container.querySelectorAll('.job-card').length).toBe(1)
  })

  it('never swaps the list back to skeletons on a later poll', () => {
    setState([makeJob()], false)
    const { container, rerender } = render(<JobList />)

    setState([makeJob()], true)
    rerender(<JobList />)

    expect(container.querySelectorAll('.skeleton-card').length).toBe(0)
    expect(container.querySelectorAll('.job-card').length).toBe(1)
  })

  it('does not show skeletons again after a first load that returned no jobs', () => {
    setState([], true)
    const { container, rerender } = render(<JobList />)
    expect(container.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0)

    setState([], false)
    rerender(<JobList />)
    expect(screen.getByText('Noch keine Aufträge')).toBeTruthy()

    setState([], true)
    rerender(<JobList />)

    expect(container.querySelectorAll('.skeleton-card').length).toBe(0)
    expect(screen.getByText('Noch keine Aufträge')).toBeTruthy()
  })
})
