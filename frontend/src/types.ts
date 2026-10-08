export type JobStatus = 'pending' | 'running' | 'done' | 'failed'

export type AnalysisType = 'word_count' | 'top_words' | 'reading_time'

export interface Job {
  id: number
  text: string
  analysis: AnalysisType
  status: JobStatus
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
  updated_at: string
}

export class ApiError extends Error {
  readonly code: string
  readonly details: Record<string, unknown> | null

  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}
