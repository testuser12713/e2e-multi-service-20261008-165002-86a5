import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { JobsProvider } from './state/jobs'
import './styles/app.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(container).render(
  <StrictMode>
    <JobsProvider>
      <App />
    </JobsProvider>
  </StrictMode>,
)
