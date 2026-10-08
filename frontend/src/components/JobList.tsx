import { useEffect, useState, type ReactElement } from 'react'
import { getApiBaseUrl } from '../api/client'
import { useJobs } from '../state/jobs'
import type { Job, JobStatus } from '../types'
import { JobResult } from './JobResult'

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Wartend',
  running: 'In Arbeit',
  done: 'Fertig',
  failed: 'Fehlgeschlagen',
}

export interface JobListProps {}

export function StatusBadge({ status }: { status: JobStatus }): ReactElement {
  return (
    <span className={`badge badge--${status}`}>
      {status === 'running' && <span className="badge__dot" aria-hidden="true" />}
      {STATUS_LABELS[status]}
    </span>
  )
}

function JobCard({ job }: { job: Job }): ReactElement {
  const cardClass =
    job.status === 'running' ? 'job-card job-card--running' : 'job-card'
  return (
    <article className={cardClass}>
      <div className="job-card__header">
        <div className="job-card__meta">
          <span className="job-card__id">#{job.id}</span>
          <span className="job-card__type">· {job.analysis}</span>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <p className="job-card__preview" title={job.text}>
        {job.text}
      </p>
      <JobResult job={job} />
    </article>
  )
}

function EmptyState(): ReactElement {
  return (
    <div className="empty-state">
      <svg
        className="empty-state__glyph"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 15h34M12 15l2-6h20l2 6"
          stroke="var(--color-borderStrong)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="9"
          y="15"
          width="30"
          height="25"
          rx="3"
          stroke="var(--color-borderStrong)"
          strokeWidth="1.5"
        />
        <path
          d="M16 26h16"
          stroke="var(--color-borderStrong)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <h2 className="empty-state__heading">Noch keine Aufträge</h2>
      <p className="empty-state__body">
        Gib oben einen Text ein und wähle einen Auswertungstyp – neue Aufträge
        erscheinen hier und aktualisieren sich automatisch.
      </p>
      <a className="empty-state__link" href="#job-text">
        Text eingeben
      </a>
    </div>
  )
}

function ErrorBanner({
  onRetry,
  onDismiss,
}: {
  onRetry: () => void
  onDismiss: () => void
}): ReactElement {
  const apiBaseUrl = getApiBaseUrl() || window.location.origin
  return (
    <div className="error-banner" role="alert">
      <svg
        className="error-banner__icon"
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
      <div className="error-banner__content">
        API nicht erreichbar unter{' '}
        <span style={{ fontFamily: 'var(--font-mono)' }}>{apiBaseUrl}</span>.
        Erneuter Versuch alle 3 s.
      </div>
      <div className="error-banner__actions">
        <button
          className="btn btn--secondary btn--sm"
          type="button"
          onClick={onRetry}
        >
          Erneut versuchen
        </button>
        <button
          className="error-banner__dismiss"
          type="button"
          aria-label="Hinweis schließen"
          onClick={onDismiss}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function JobList(_props: JobListProps): ReactElement {
  const { jobs, error, refresh } = useJobs()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (error === null) {
      setDismissed(false)
    }
  }, [error])

  const ordered = [...jobs].sort((a, b) => {
    if (a.created_at === b.created_at) {
      return b.id - a.id
    }
    return a.created_at < b.created_at ? 1 : -1
  })

  const showBanner = error !== null && !dismissed

  return (
    <>
      {showBanner && (
        <ErrorBanner
          onRetry={() => {
            void refresh()
          }}
          onDismiss={() => setDismissed(true)}
        />
      )}

      {ordered.length === 0
        ? error === null && <EmptyState />
        : (
            <section className="job-list" aria-label="Aufträge">
              {ordered.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </section>
          )}
    </>
  )
}
