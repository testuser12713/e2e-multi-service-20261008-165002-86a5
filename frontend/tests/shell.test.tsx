import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { JobsProvider } from '../src/state/jobs'

describe('app shell', () => {
  it('renders the header with wordmark, poll indicator and refresh control', async () => {
    render(
      <JobsProvider>
        <App />
      </JobsProvider>,
    )

    expect(screen.getByText('Job Runner')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Jetzt aktualisieren' }),
    ).toBeTruthy()
    expect(await screen.findByText('Live · aktualisiert')).toBeTruthy()
  })

  it('renders the page container that stacks the form above the list', () => {
    const { container } = render(
      <JobsProvider>
        <App />
      </JobsProvider>,
    )

    expect(container.querySelector('.app-header')).not.toBeNull()
    expect(container.querySelector('.page-main')).not.toBeNull()
    expect(container.querySelector('.container')).not.toBeNull()
  })
})
