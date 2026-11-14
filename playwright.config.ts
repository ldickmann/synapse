import { defineConfig } from '@playwright/test'

// Os testes rodam contra o build de verificação (window.__verificacao):
//   pnpm build:verificacao && pnpm verificar:testes
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
    // Chromium completo (não o headless-shell). No Windows, o WebGL roda na GPU (ANGLE sobre D3D11).
    // No Linux do CI não há GPU: o WebGL roda no SwiftShader, que o Chromium só libera com
    // --enable-unsafe-swiftshader.
    channel: 'chromium',
    launchOptions: {
      args:
        process.platform === 'win32'
          ? ['--ignore-gpu-blocklist', '--use-angle=d3d11']
          : ['--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `pnpm start:verificacao --port ${PORTA}`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
