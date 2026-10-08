import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { JobForm } from '../src/components/JobForm'
import { JobsProvider, useJobs } from '../src/state/jobs'
import { loadJobs, submitJob } from '../src/state/jobsApi'
import { ApiError } from '../src/types'
import type { Job } from '../src/types'

const { createJobMock, listJobsMock } = vi.hoisted(() => ({
  createJobMock: vi.fn(),
  listJobsMock: vi.fn(),
}))

vi.mock('../src/api/client', () => ({
  createJob: createJobMock,
  listJobs: listJobsMock,
  getJob: vi.fn(),
  getApiBaseUrl: () => '',
}))

function JobsProbe(): ReactElement {
  const { jobs, error } = useJobs()
  return (
    <>
      {error !== null && <p data-testid="error">{error}</p>}
      <ul data-testid="jobs">
        {jobs.map((job) => (
          <li key={job.id}>{`#${job.id} ${job.status}`}</li>
        ))}
      </ul>
    </>
  )
}

function renderForm(): { container: HTMLElement } {
  return render(
    <JobsProvider>
      <JobForm />
      <JobsProbe />
    </JobsProvider>,
  )
}

function submitForm(container: HTMLElement): void {
  const form = container.querySelector('form')
  if (form === null) {
    throw new Error('form not rendered')
  }
  fireEvent.submit(form)
}

const pendingJob: Job = {
  id: 1,
  text: 'drei kleine Wörter',
  analysis: 'word_count',
  status: 'pending',
  result: null,
  error: null,
  created_at: '2026-10-08T14:02:31Z',
  updated_at: '2026-10-08T14:02:31Z',
}

describe('JobForm', () => {
  beforeEach(() => {
    createJobMock.mockReset()
    listJobsMock.mockReset()
    listJobsMock.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it('renders a pristine, untouched form without any error marking', () => {
    renderForm()

    expect(screen.queryByText('Text darf nicht leer sein.')).toBeNull()
    expect(
      screen.getByLabelText('Text').getAttribute('aria-invalid'),
    ).toBeNull()
    expect(document.querySelector('.field--error')).toBeNull()
    expect(createJobMock).not.toHaveBeenCalled()
  })

  it('rejects blank text only after a submit attempt', async () => {
    const { container } = renderForm()

    const textarea = screen.getByLabelText('Text')
    fireEvent.change(textarea, { target: { value: '   ' } })
    expect(screen.queryByText('Text darf nicht leer sein.')).toBeNull()

    submitForm(container)

    expect(await screen.findByText('Text darf nicht leer sein.')).toBeTruthy()
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    expect(createJobMock).not.toHaveBeenCalled()
  })

  it('puts a valid submission into the list as pending without a reload', async () => {
    createJobMock.mockResolvedValue(pendingJob)
    const { container } = renderForm()

    const textarea = screen.getByLabelText('Text')
    fireEvent.change(textarea, { target: { value: 'drei kleine Wörter' } })
    submitForm(container)

    expect(await screen.findByText('#1 pending')).toBeTruthy()
    expect(createJobMock).toHaveBeenCalledWith({
      text: 'drei kleine Wörter',
      analysis: 'word_count',
    })
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('')
    })
  })
})

describe('jobsApi', () => {
  beforeEach(() => {
    createJobMock.mockReset()
    listJobsMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('rejects with the readable message of the failing ApiError', async () => {
    listJobsMock.mockRejectedValue(
      new ApiError('network_error', 'Cannot reach the API at http://api.test.'),
    )

    await expect(loadJobs()).rejects.toThrow(
      'Cannot reach the API at http://api.test.',
    )

    createJobMock.mockRejectedValue(
      new ApiError('validation_error', 'text must not be empty'),
    )

    await expect(
      submitJob({ text: '', analysis: 'word_count' }),
    ).rejects.toThrow('text must not be empty')
  })
})
