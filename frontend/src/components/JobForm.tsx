import { useId, useState, type FormEvent, type ReactElement } from 'react'
import type { AnalysisType } from '../types'
import { useJobs } from '../state/jobs'

const ANALYSIS_OPTIONS: ReadonlyArray<{ value: AnalysisType; label: string }> = [
  { value: 'word_count', label: 'Wortanzahl' },
  { value: 'top_words', label: 'Häufigste Wörter' },
  { value: 'reading_time', label: 'Lesezeit' },
]

export interface JobFormProps {}

export function JobForm(_props: JobFormProps): ReactElement {
  const { createJob } = useJobs()
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisType>('word_count')
  const [showError, setShowError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const textId = useId()
  const analysisId = useId()
  const errorId = useId()

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    if (submitting) {
      return
    }
    if (text.trim() === '') {
      setShowError(true)
      return
    }
    setShowError(false)
    setSubmitting(true)
    try {
      await createJob({ text: text.trim(), analysis })
      setText('')
    } catch {
      // The shared jobs state exposes the readable error to the error banner.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="job-form" noValidate onSubmit={handleSubmit}>
      <div className={`field${showError ? ' field--error' : ''}`}>
        <label className="field__label" htmlFor={textId}>
          Text
        </label>
        <textarea
          className="field__control"
          id={textId}
          name="text"
          placeholder="Text eingeben, der ausgewertet werden soll …"
          value={text}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
          onChange={(event) => {
            setText(event.target.value)
            if (showError) {
              setShowError(false)
            }
          }}
        />
        {showError && (
          <p className="field__error" id={errorId}>
            <svg
              className="field__error-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 1.8 14.2 13H1.8L8 1.8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8 6.2v3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="11.4" r="0.75" fill="currentColor" />
            </svg>
            <span>Text darf nicht leer sein.</span>
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={analysisId}>
          Auswertung
        </label>
        <select
          className="field__control"
          id={analysisId}
          name="analysis"
          value={analysis}
          onChange={(event) =>
            setAnalysis(event.target.value as AnalysisType)
          }
        >
          {ANALYSIS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="job-form__actions">
        <button
          className={`btn btn--primary${submitting ? ' is-loading' : ''}`}
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
        >
          {submitting ? 'Erstelle …' : 'Auftrag erstellen'}
        </button>
      </div>
    </form>
  )
}
