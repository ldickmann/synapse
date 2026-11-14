// Viewports dos critérios, usados pelos testes (tests/site.spec.ts) e pelas capturas (scripts/screenshots.ts).
// Não é um arquivo de teste: o Playwright só roda os *.spec.ts.

export const CELULAR = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}
// A primeira tela vale também em 375×667 (X1).
export const CELULAR_375 = { ...CELULAR, viewport: { width: 375, height: 667 } }
export const DESKTOP = { viewport: { width: 1440, height: 900 } }
