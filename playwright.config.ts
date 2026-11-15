import { defineConfig } from '@playwright/test'

// Os testes rodam contra a exportação (out/), servida por pnpm start: pnpm build && pnpm verificar:testes
const PORTA = Number(process.env.PORTA ?? 3000)

export default defineConfig({
  testDir: './tests',
  outputDir: './verificacao/test-results',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 3,
  // No GitHub Actions, as falhas viram anotações no PR.
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `pnpm start --port ${PORTA}`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
