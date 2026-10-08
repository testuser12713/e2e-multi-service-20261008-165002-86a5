import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AnalysisType, Job } from '../types'
import { loadJobs, submitJob } from './jobsApi'
import { usePolling } from '../hooks/usePolling'

export const POLL_INTERVAL_MS = 3000

export interface CreateJobInput {
  text: string
  analysis: AnalysisType
}

export interface JobsContextValue {
  jobs: Job[]
  loading: boolean
  error: string | null
  createJob(input: CreateJobInput): Promise<void>
  refresh(): Promise<void>
}

const JobsContext = createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const next = await loadJobs()
      setJobs(next)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  const createJob = useCallback(async (input: CreateJobInput): Promise<void> => {
    setLoading(true)
    try {
      const job = await submitJob(input)
      setJobs((previous) => [job, ...previous])
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler')
      throw cause
    } finally {
      setLoading(false)
    }
  }, [])

  usePolling(refresh, POLL_INTERVAL_MS)

  const value = useMemo<JobsContextValue>(
    () => ({ jobs, loading, error, createJob, refresh }),
    [jobs, loading, error, createJob, refresh],
  )

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs(): JobsContextValue {
  const context = useContext(JobsContext)
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider')
  }
  return context
}
