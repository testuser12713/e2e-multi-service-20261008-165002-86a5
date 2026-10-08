import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // The office's Playwright smoke crawl lives under e2e/ and must not be
    // collected by Vitest (it requires @playwright/test, which Vitest does
    // not install). Keep the default excludes and add that directory.
    exclude: [...configDefaults.exclude, '**/e2e/**'],
  },
})
