import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../src/types'
import { createJob, getJob, listJobs } from '../src/api/client'

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('api client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test:8000/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('builds the listJobs URL from the configured base URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { jobs: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const jobs = await listJobs()

    expect(jobs).toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('http://api.test:8000/api/jobs', undefined)
  })

  it('builds the getJob URL from the configured base URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { id: 7 }))
    vi.stubGlobal('fetch', fetchMock)

    await getJob(7)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test:8000/api/jobs/7', undefined)
  })

  it('posts a new job as JSON to the createJob endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(201, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await createJob({ text: 'hello', analysis: 'word_count' })

    expect(fetchMock).toHaveBeenCalledWith('http://api.test:8000/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'hello', analysis: 'word_count' }),
    })
  })

  it('maps a non-2xx error body to an ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(422, {
        error: {
          code: 'validation_error',
          message: 'text must not be empty',
          details: { field: 'text' },
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const caught = await listJobs().catch((error: unknown) => error)

    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).code).toBe('validation_error')
    expect((caught as ApiError).message).toBe('text must not be empty')
    expect((caught as ApiError).details).toEqual({ field: 'text' })
  })

  it('turns a transport failure into an ApiError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const caught = await listJobs().catch((error: unknown) => error)

    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).code).toBe('network_error')
  })
})
