import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { JobForm } from './components/JobForm'
import { JobList } from './components/JobList'
import { useJobs } from './state/jobs'

export function formatTimestamp(date: Date): string {
  const iso = date.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`
}

export function App(): ReactElement {
  const { error, refresh } = useJobs()
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const handleRefresh = useCallback((): void => {
    void refresh().finally(() => setLastUpdated(new Date()))
  }, [refresh])

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <span className="wordmark">Job Runner</span>
          <div className="poll-indicator">
            <span className="poll-indicator__text">
              <span
                className={`poll-indicator__dot ${
                  error ? 'poll-indicator__dot--wait' : 'poll-indicator__dot--ok'
                }`}
                aria-hidden="true"
              />
              {error ? 'Verbinde neu …' : 'Live · aktualisiert'}
            </span>
            {lastUpdated !== null && (
              <span className="poll-indicator__ts">
                {formatTimestamp(lastUpdated)}
              </span>
            )}
            <button
              type="button"
              className="refresh-btn"
              aria-label="Jetzt aktualisieren"
              title="Jetzt aktualisieren"
              onClick={handleRefresh}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V5h-2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="container">
          <div className="page-main">
            <JobForm />
            <JobList />
          </div>
        </div>
      </main>
    </>
  )
}
