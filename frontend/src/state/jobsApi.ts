import { ApiError } from '../types'
import type { AnalysisType, Job } from '../types'
import { createJob, listJobs } from '../api/client'

export interface SubmitJobInput {
  text: string
  analysis: AnalysisType
}

function toReadableError(cause: unknown): Error {
  if (cause instanceof ApiError) {
    return new ApiError(cause.code, cause.message, cause.details)
  }
  if (cause instanceof Error) {
    return cause
  }
  return new Error('Unbekannter Fehler')
}

export async function loadJobs(): Promise<Job[]> {
  try {
    return await listJobs()
  } catch (cause) {
    throw toReadableError(cause)
  }
}

export async function submitJob(input: SubmitJobInput): Promise<Job> {
  try {
    return await createJob(input)
  } catch (cause) {
    throw toReadableError(cause)
  }
}
