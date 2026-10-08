import { ApiError } from '../types'
import type { AnalysisType, Job } from '../types'

export interface CreateJobInput {
  text: string
  analysis: AnalysisType
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!raw) {
    return ''
  }
  return raw.replace(/\/+$/, '')
}

function toApiError(status: number, body: unknown): ApiError {
  const error = (body as { error?: unknown } | null)?.error as
    | { code?: unknown; message?: unknown; details?: unknown }
    | undefined

  const code = typeof error?.code === 'string' ? error.code : `http_${status}`
  const message =
    typeof error?.message === 'string'
      ? error.message
      : `Request failed with status ${status}`
  const details =
    error?.details && typeof error.details === 'object'
      ? (error.details as Record<string, unknown>)
      : null

  return new ApiError(code, message, details)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl()

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, init)
  } catch {
    throw new ApiError(
      'network_error',
      `Cannot reach the API at ${baseUrl || window.location.origin}.`,
    )
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    throw toApiError(response.status, body)
  }

  return body as T
}

export async function listJobs(): Promise<Job[]> {
  const body = await request<{ jobs: Job[] }>('/api/jobs')
  return body.jobs
}

export async function getJob(id: number): Promise<Job> {
  return request<Job>(`/api/jobs/${id}`)
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  return request<Job>('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
