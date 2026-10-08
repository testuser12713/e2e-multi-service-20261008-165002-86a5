import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job } from '../src/types'

const { useJobsMock } = vi.hoisted(() => ({ useJobsMock: vi.fn() }))

vi.mock('../src/state/jobs', () => ({ useJobs: useJobsMock }))

import { JobList } from '../src/components/JobList'

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

function setJobs(jobs: Job[], error: string | null = null): void {
  useJobsMock.mockReturnValue({
    jobs,
    loading: false,
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

describe('JobList statuses', () => {
  it('renders all four status labels', () => {
    setJobs([
      makeJob({ id: 4, status: 'pending', result: null }),
      makeJob({ id: 3, status: 'running', result: null }),
      makeJob({ id: 2, status: 'done' }),
      makeJob({ id: 1, status: 'failed', result: null, error: 'kaputt' }),
    ])

    render(<JobList />)

    expect(screen.getByText('Wartend')).toBeTruthy()
    expect(screen.getByText('In Arbeit')).toBeTruthy()
    expect(screen.getByText('Fertig')).toBeTruthy()
    expect(screen.getByText('Fehlgeschlagen')).toBeTruthy()
  })

  it('renders jobs newest first', () => {
    setJobs([
      makeJob({ id: 1, created_at: '2026-10-08T10:00:00Z', result: null, status: 'pending' }),
      makeJob({ id: 2, created_at: '2026-10-08T12:00:00Z', result: null, status: 'pending' }),
      makeJob({ id: 3, created_at: '2026-10-08T11:00:00Z', result: null, status: 'pending' }),
    ])

    const { container } = render(<JobList />)
    const ids = Array.from(container.querySelectorAll('.job-card__id')).map(
      (node) => node.textContent,
    )

    expect(ids).toEqual(['#2', '#3', '#1'])
  })
})

describe('JobResult per analysis type', () => {
  it('renders the word count', () => {
    setJobs([makeJob({ analysis: 'word_count', result: { words: 3 } })])

    const { container } = render(<JobList />)

    expect(container.querySelector('.result-wordcount__num')?.textContent).toBe('3')
    expect(container.querySelector('.result-wordcount__unit')?.textContent).toBe('Wörter')
  })

  it('renders the singular word unit for a single word', () => {
    setJobs([makeJob({ analysis: 'word_count', result: { words: 1 } })])

    render(<JobList />)

    expect(screen.getByText('Wort')).toBeTruthy()
  })

  it('renders the ordered top words list', () => {
    setJobs([
      makeJob({
        analysis: 'top_words',
        result: {
          words: [
            { word: 'der', count: 3 },
            { word: 'hund', count: 2 },
            { word: 'katze', count: 1 },
          ],
        },
      }),
    ])

    const { container } = render(<JobList />)
    const rows = container.querySelectorAll('.result-topwords__row')

    expect(rows.length).toBe(3)
    expect(rows[0]?.querySelector('.result-topwords__word')?.textContent).toBe('der')
    expect(rows[0]?.querySelector('.result-topwords__count')?.textContent).toBe('3')
    const fills = container.querySelectorAll<HTMLElement>('.result-topwords__bar-fill')
    expect(fills[0]?.style.width).toBe('100%')
    expect(fills[2]?.style.width).toMatch(/^33\.3/)
  })

  it('renders the reading time estimate with its basis', () => {
    setJobs([
      makeJob({
        analysis: 'reading_time',
        result: { minutes: 2.5, words: 500 },
      }),
    ])

    const { container } = render(<JobList />)

    expect(container.querySelector('.result-readingtime__value')?.textContent).toBe(
      '≈ 2 min 30 s',
    )
    expect(container.querySelector('.result-readingtime__basis')?.textContent).toBe(
      'basierend auf 500 Wörtern bei 200 Wörtern/min',
    )
  })
})

describe('JobList failed jobs', () => {
  it('renders the error message of a failed job', () => {
    setJobs([
      makeJob({
        status: 'failed',
        result: null,
        error: 'Auswertung fehlgeschlagen: Lesezeit konnte nicht berechnet werden.',
      }),
    ])

    render(<JobList />)

    expect(
      screen.getByText(
        'Auswertung fehlgeschlagen: Lesezeit konnte nicht berechnet werden.',
      ),
    ).toBeTruthy()
  })
})

describe('JobList empty state', () => {
  it('shows the empty state when there are no jobs', () => {
    setJobs([])

    render(<JobList />)

    expect(screen.getByText('Noch keine Aufträge')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('JobList API failure state', () => {
  it('shows an error banner above the list instead of a silently empty list', () => {
    setJobs([], 'Cannot reach the API at http://localhost:8000.')

    render(<JobList />)

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Erneut versuchen')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Hinweis schließen' }),
    ).toBeTruthy()
    expect(screen.queryByText('Noch keine Aufträge')).toBeNull()
  })

  it('calls refresh when the retry control is used', () => {
    const refresh = vi.fn()
    useJobsMock.mockReturnValue({
      jobs: [],
      loading: false,
      error: 'Cannot reach the API at http://localhost:8000.',
      createJob: vi.fn(),
      refresh,
    })

    render(<JobList />)
    fireEvent.click(screen.getByText('Erneut versuchen'))

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('hides the banner when dismissed', () => {
    setJobs([], 'Cannot reach the API at http://localhost:8000.')

    render(<JobList />)
    fireEvent.click(screen.getByRole('button', { name: 'Hinweis schließen' }))

    expect(screen.queryByRole('alert')).toBeNull()
  })
})
