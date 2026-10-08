import type { AnalysisType, Job } from '../types'

export interface SubmitJobInput {
  text: string
  analysis: AnalysisType
}

export async function loadJobs(): Promise<Job[]> {
  return []
}

export async function submitJob(_input: SubmitJobInput): Promise<Job> {
  return {} as Job
}
