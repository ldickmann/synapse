// Viewports e espera dos critérios, usados pelos testes (tests/site.spec.ts) e pelas capturas (scripts/screenshots.ts).
// Não é um arquivo de teste: o Playwright só roda os *.spec.ts.
import type { Page } from '@playwright/test'

export const CELULAR = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}
// A primeira tela vale também em 375×667 (X1).
export const CELULAR_375 = { ...CELULAR, viewport: { width: 375, height: 667 } }
export const DESKTOP = { viewport: { width: 1440, height: 900 } }

// A entrada acaba por volta de 2,6 s depois da hidratação: o Decodificar conta o atraso a partir do efeito que roda
// com `data-pronto`, e o nome do hero decodifica de 1,5 s até 1,5 s + 2 × 180 ms + 720 ms (componentes/Hero.tsx).
// O boot, só em CSS, conta da carga do HTML e termina antes; o getAnimations() cobre o que ainda estiver rodando.
const ENTRADA_MS = 3000

/**
 * Espera a página assentar: hidratação (`data-pronto`), ENTRADA_MS contados dela, nenhuma palavra decodificando
 * e nenhuma animação finita rodando. As infinitas (robôs, marquee) não contam.
 */
export async function esperarEntrada(page: Page): Promise<void> {
  await page.locator('[data-pronto="true"]').waitFor({ state: 'attached' })
  // Contado de quando `data-pronto` aparece aqui, o que nunca é antes da hidratação.
  const fim = (await page.evaluate(() => performance.now())) + ENTRADA_MS
  await page.waitForFunction(
    (limite) =>
      performance.now() >= limite &&
      document.querySelector('[data-decodificando="true"]') === null &&
      document
        .getAnimations()
        .every(
          (animacao) =>
            animacao.playState !== 'running' || animacao.effect?.getComputedTiming().iterations === Infinity,
        ),
    fim,
    { timeout: 20_000 },
  )
}
