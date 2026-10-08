import type { ReactElement } from 'react'
import type { Job } from '../types'

export interface JobResultProps {
  job: Job
}

interface WordEntry {
  word: string
  count: number
}

const WORDS_PER_MINUTE = 200

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readWordEntries(value: unknown): WordEntry[] {
  if (!Array.isArray(value)) {
    return []
  }
  const entries: WordEntry[] = []
  for (const item of value) {
    if (item === null || typeof item !== 'object') {
      continue
    }
    const record = item as Record<string, unknown>
    const word = record.word
    const count = record.count
    if (typeof word === 'string' && typeof count === 'number' && Number.isFinite(count)) {
      entries.push({ word, count })
    }
  }
  return entries
}

function formatCount(value: number): string {
  if (value < 10000) {
    return String(value)
  }
  const grouped = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')
  return grouped
}

function WordCountResult({ job }: JobResultProps): ReactElement | null {
  const words = readNumber(job.result?.words)
  if (words === null) {
    return null
  }
  return (
    <div className="job-card__result">
      <div className="result-wordcount">
        <span className="result-wordcount__num">{formatCount(words)}</span>
        <span className="result-wordcount__unit">{words === 1 ? 'Wort' : 'Wörter'}</span>
      </div>
    </div>
  )
}

function TopWordsResult({ job }: JobResultProps): ReactElement | null {
  const entries = readWordEntries(job.result?.words).slice(0, 10)
  if (entries.length === 0) {
    return null
  }
  const maxCount = entries.reduce(
    (max, entry) => (entry.count > max ? entry.count : max),
    0,
  )
  return (
    <div className="job-card__result">
      <ol className="result-topwords">
        {entries.map((entry, index) => {
          const width = maxCount > 0 ? (entry.count / maxCount) * 100 : 0
          return (
            <li className="result-topwords__row" key={`${entry.word}-${index}`}>
              <span className="result-topwords__rank">{index + 1}</span>
              <span className="result-topwords__word">{entry.word}</span>
              <span className="result-topwords__bar">
                <span
                  className="result-topwords__bar-fill"
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="result-topwords__count">{formatCount(entry.count)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ReadingTimeResult({ job }: JobResultProps): ReactElement | null {
  const minutes = readNumber(job.result?.minutes)
  if (minutes === null) {
    return null
  }
  const words = readNumber(job.result?.words)
  const totalSeconds = Math.round(minutes * 60)
  const wholeMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const value =
    seconds === 0
      ? `≈ ${wholeMinutes} min`
      : `≈ ${wholeMinutes} min ${seconds} s`
  const basis =
    words === null
      ? `basierend auf ${WORDS_PER_MINUTE} Wörtern/min`
      : `basierend auf ${formatCount(words)} ${
          words === 1 ? 'Wort' : 'Wörtern'
        } bei ${WORDS_PER_MINUTE} Wörtern/min`
  return (
    <div className="job-card__result">
      <div className="result-readingtime">
        <span className="result-readingtime__value">{value}</span>
        <span className="result-readingtime__basis">{basis}</span>
      </div>
    </div>
  )
}

function ErrorResult({ job }: JobResultProps): ReactElement {
  return (
    <div className="job-card__error">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{ flex: 'none', marginTop: '1px' }}
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
      <span>{job.error ?? 'Die Auswertung ist fehlgeschlagen.'}</span>
    </div>
  )
}

export function JobResult({ job }: JobResultProps): ReactElement | null {
  if (job.status === 'failed') {
    return <ErrorResult job={job} />
  }
  if (job.status !== 'done' || job.result === null) {
    return null
  }
  switch (job.analysis) {
    case 'word_count':
      return <WordCountResult job={job} />
    case 'top_words':
      return <TopWordsResult job={job} />
    case 'reading_time':
      return <ReadingTimeResult job={job} />
    default:
      return null
  }
}
