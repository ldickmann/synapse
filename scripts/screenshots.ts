// Capturas de `/` contra `pnpm start`, em verificacao/screenshots/:
//   <hero|pico|final>-<375|1440>.png (pico: seção de serviços no alto da tela) e foco-1440.png.
// Uso: node scripts/screenshots.ts   (env opcional: PORTA=3000)
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import { CELULAR_375, DESKTOP, esperarEntrada } from '../tests/comum.ts'

type Estado = 'hero' | 'pico' | 'final'

const RAIZ = path.resolve(import.meta.dirname, '..')
const PASTA = path.join(RAIZ, 'verificacao', 'screenshots')
const BASE = `http://localhost:${process.env.PORTA ?? 3000}`
const ESTADOS: Estado[] = ['hero', 'pico', 'final']
type Largura = { largura: number; opcoes: BrowserContextOptions }
const LARGURAS: Largura[] = [
  { largura: 375, opcoes: CELULAR_375 },
  { largura: 1440, opcoes: DESKTOP },
]

const gerados: string[] = []
const avisos: string[] = []
const falhas: string[] = []

async function capturar(page: Page, nome: string): Promise<void> {
  const arquivo = path.join(PASTA, nome)
  await page.screenshot({ path: arquivo })
  gerados.push(nome)
  console.log(`  ${nome}`)
}

async function rolarAteOFim(page: Page): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 }
  await page.mouse.move(viewport.width / 2, viewport.height / 2)
  let parado = 0
  for (let i = 0; i < 400 && parado < 5; i++) {
    const { y, max } = await page.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight }))
    if (y >= max - 1) break
    await page.mouse.wheel(0, Math.min(viewport.height * 0.8, max - y + 50))
    await page.waitForTimeout(90)
    parado = (await page.evaluate(() => scrollY)) === y ? parado + 1 : 0
  }
  const faltando = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY)
  if (faltando > 1) {
    avisos.push(`${page.url()}: mouse.wheel não chegou ao fim (faltaram ${Math.round(faltando)} px); usado scrollTo`)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  }
}

/** Seção de serviços no alto da tela, com o título já decodificado. */
async function pico(page: Page, contexto: string): Promise<void> {
  try {
    await page.locator('#servicos').evaluate((secao) => secao.scrollIntoView({ block: 'start', behavior: 'instant' }))
  } catch {
    falhas.push(`${contexto}: seção #servicos não encontrada`)
  }
  await page.waitForTimeout(1500)
}

async function final(page: Page): Promise<void> {
  await rolarAteOFim(page)
  await page.waitForTimeout(1500)
}

async function capturarLargura(navegador: Browser, largura: number, opcoes: BrowserContextOptions) {
  const contexto = await navegador.newContext(opcoes)
  const page = await contexto.newPage()
  const nome = `/ ${largura}`
  try {
    await page.goto(`${BASE}/`)
    // A primeira tela assentada: sem o boot e com o nome já decodificado, não a camada de 0 e 1.
    await esperarEntrada(page)
    await capturar(page, `hero-${largura}.png`)
    for (const [estado, executar] of [
      ['pico', pico],
      ['final', final],
    ] as const) {
      try {
        await executar(page, `${nome} ${estado}`)
      } catch (erro) {
        falhas.push(`${nome} ${estado}: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
      await capturar(page, `${estado}-${largura}.png`)
    }
  } finally {
    await contexto.close()
  }
}

try {
  await fetch(`${BASE}/`)
} catch {
  console.error(`Servidor não respondeu em ${BASE}. Rode antes: pnpm build && pnpm start`)
  process.exit(1)
}
mkdirSync(PASTA, { recursive: true })
console.log(`Capturas em ${path.relative(RAIZ, PASTA)}:`)

const navegador = await chromium.launch()
try {
  for (const { largura, opcoes } of LARGURAS) {
    try {
      await capturarLargura(navegador, largura, opcoes)
    } catch (erro) {
      falhas.push(`/ ${largura}: ${erro instanceof Error ? erro.message : String(erro)}`)
    }
  }

  const foco = await navegador.newContext(DESKTOP)
  const pagina = await foco.newPage()
  await pagina.goto(`${BASE}/`)
  await esperarEntrada(pagina)
  for (let i = 0; i < 3; i++) await pagina.keyboard.press('Tab')
  await pagina.waitForTimeout(300)
  await capturar(pagina, 'foco-1440.png')
  await foco.close()
} finally {
  await navegador.close()
}

const esperados = ESTADOS.flatMap((estado) => LARGURAS.map(({ largura }) => `${estado}-${largura}.png`))
const ausentes = esperados.filter((nome) => !existsSync(path.join(PASTA, nome)))
console.log(
  `\n${gerados.length} arquivos gravados; ${esperados.length - ausentes.length} de ${esperados.length} capturas por estado presentes.`,
)
for (const aviso of avisos) console.log(`Aviso: ${aviso}`)
for (const falha of falhas) console.log(`Falha: ${falha}`)
if (ausentes.length > 0) console.log(`Ausentes: ${ausentes.join(', ')}`)
if (ausentes.length > 0 || falhas.length > 0) process.exitCode = 1
