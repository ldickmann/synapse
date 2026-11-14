// G25 e capturas citadas no SPEC §8, contra `pnpm start:verificacao`.
// Gera em verificacao/screenshots/:
//   mesa-<hero|pico|final>-<390|768|1440>.png (9), index-390.png,
//   mesa-semwebgl-390.png (Chromium com --disable-3d-apis) e <rota>-foco-1440.png.
// A Sinapse (exploração, SPEC §11) entra com 375 e 1440 e sem a captura sem WebGL, que ela não usa:
//   sinapse-<hero|pico|final>-<375|1440>.png (pico: seção de serviços no alto da tela) e sinapse-foco-1440.png.
// Uso: node scripts/screenshots.ts   (env opcionais: PORTA=3000  ROTAS=mesa,sinapse)
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type BrowserContextOptions, type Locator, type Page } from '@playwright/test'

type Rota = 'mesa' | 'sinapse'
type Estado = 'hero' | 'pico' | 'final'
type Ponto = { x: number; y: number }

const RAIZ = path.resolve(import.meta.dirname, '..')
const PASTA = path.join(RAIZ, 'verificacao', 'screenshots')
const BASE = `http://localhost:${process.env.PORTA ?? 3000}`
const TODAS: Rota[] = ['mesa', 'sinapse']
const ROTAS: Rota[] = process.env.ROTAS
  ? (process.env.ROTAS.split(',').map((s) => s.trim()).filter(Boolean) as Rota[])
  : TODAS
const invalidas = ROTAS.filter((r) => !TODAS.includes(r))
if (invalidas.length > 0) {
  console.error(`ROTAS inválidas: ${invalidas.join(', ')} (use ${TODAS.join(',')})`)
  process.exit(1)
}
const ESTADOS: Estado[] = ['hero', 'pico', 'final']
const GPU = ['--ignore-gpu-blocklist', '--use-angle=d3d11']
const CELULAR: BrowserContextOptions = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}
const CELULAR_375: BrowserContextOptions = { ...CELULAR, viewport: { width: 375, height: 667 } }
type Largura = { largura: number; opcoes: BrowserContextOptions }
const LARGURAS: Largura[] = [
  { largura: 390, opcoes: CELULAR },
  { largura: 768, opcoes: { viewport: { width: 768, height: 1024 } } },
  { largura: 1440, opcoes: { viewport: { width: 1440, height: 900 } } },
]
// A Sinapse é exploração (§11): só o celular de 375 e o desktop de 1440, sem WebGL nem window.__verificacao.
const LARGURAS_EXPLORACAO: Largura[] = [{ largura: 375, opcoes: CELULAR_375 }, LARGURAS[2]]
const ehExploracao = (rota: Rota): boolean => rota === 'sinapse'
const largurasDe = (rota: Rota): Largura[] => (ehExploracao(rota) ? LARGURAS_EXPLORACAO : LARGURAS)
const celularDe = (rota: Rota): Largura => largurasDe(rota)[0]
const IDS_PARTES = ['quem-voce-e', 'onde-fica', 'como-falar', 'horarios', 'o-que-oferece', 'aparecer-nas-buscas']

const gerados: string[] = []
const avisos: string[] = []
const falhas: string[] = []

async function capturar(page: Page, nome: string): Promise<void> {
  const arquivo = path.join(PASTA, nome)
  await page.screenshot({ path: arquivo })
  gerados.push(nome)
  console.log(`  ${nome}`)
}

async function lerEstado(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => window.__verificacao?.estado ?? null)
}

function ponto(valor: unknown): Ponto | null {
  if (typeof valor !== 'object' || valor === null) return null
  const { x, y } = valor as Partial<Ponto>
  return typeof x === 'number' && typeof y === 'number' ? { x, y } : null
}

/** Espera [data-render="3d"]; se não vier no prazo, avisa e segue. */
async function esperar3d(page: Page, contexto: string, prazo = 20_000): Promise<void> {
  if ((await page.locator('[data-render]').count()) === 0) {
    avisos.push(`${contexto}: a página não tem [data-render]; capturado sem esperar o 3D`)
    return
  }
  try {
    await page.locator('[data-render="3d"]').waitFor({ timeout: prazo })
  } catch {
    avisos.push(`${contexto}: [data-render="3d"] não apareceu em ${prazo / 1000} s; capturado assim mesmo`)
  }
}

/** Mesa: espera o 3D. Sinapse: espera a hidratação ([data-pronto="true"]) e a tela de carregamento. */
async function esperarPagina(page: Page, rota: Rota, contexto: string): Promise<void> {
  if (!ehExploracao(rota)) return esperar3d(page, contexto)
  try {
    await page.locator('[data-pronto="true"]').waitFor({ timeout: 20_000 })
  } catch {
    avisos.push(`${contexto}: [data-pronto="true"] não apareceu em 20 s; capturado assim mesmo`)
  }
  await page.waitForTimeout(1500)
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

function botaoVisivel(page: Page, nome: string): Locator {
  return page.getByRole('button', { name: nome, exact: true }).filter({ visible: true }).first()
}

async function pico(page: Page, rota: Rota, contexto: string): Promise<void> {
  if (rota === 'sinapse') {
    // Seção de serviços no alto da tela, com o título já decodificado.
    try {
      await page.locator('#servicos').evaluate((secao) => secao.scrollIntoView({ block: 'start', behavior: 'instant' }))
    } catch {
      falhas.push(`${contexto}: seção #servicos não encontrada`)
    }
    await page.waitForTimeout(1500)
  } else {
    for (const id of IDS_PARTES) {
      try {
        await page.locator(`[data-parte="${id}"]`).first().click({ timeout: 5000 })
      } catch {
        falhas.push(`${contexto}: botão [data-parte="${id}"] não encontrado ou não clicável`)
      }
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(2500)
  }
}

async function final(page: Page, rota: Rota, contexto: string): Promise<void> {
  await rolarAteOFim(page)
  await page.waitForTimeout(1500)
  if (rota !== 'mesa') return
  const visivel = async () => {
    const cartao = (await lerEstado(page))?.cartaoVisita as { visivel?: unknown } | undefined
    return cartao?.visivel === true
  }
  if (!(await visivel())) {
    try {
      await botaoVisivel(page, 'Pegar o cartão de visita').click({ timeout: 5000 })
    } catch {
      falhas.push(`${contexto}: botão "Pegar o cartão de visita" não encontrado ou não clicável`)
    }
    await page.waitForTimeout(1000)
  }
  const alvos = (await lerEstado(page))?.alvos as Record<string, unknown> | undefined
  const cartao = ponto(alvos?.cartaoVisita)
  if (cartao) await page.mouse.click(cartao.x, cartao.y)
  else falhas.push(`${contexto}: estado.alvos.cartaoVisita nulo; cartão de visita não foi virado`)
  await page.waitForTimeout(800)
}

async function capturarRota(navegador: Browser, rota: Rota, largura: number, opcoes: BrowserContextOptions) {
  const contexto = await navegador.newContext(opcoes)
  const page = await contexto.newPage()
  const nome = `/${rota} ${largura}`
  try {
    await page.goto(`${BASE}/${rota}`)
    await esperarPagina(page, rota, nome)
    await page.waitForTimeout(600)
    await capturar(page, `${rota}-hero-${largura}.png`)
    if (!ehExploracao(rota) && (await lerEstado(page)) === null) {
      falhas.push(`${nome}: window.__verificacao ausente (rode o build de verificação)`)
    }
    for (const [estado, executar] of [
      ['pico', pico],
      ['final', final],
    ] as const) {
      try {
        await executar(page, rota, `${nome} ${estado}`)
      } catch (erro) {
        falhas.push(`${nome} ${estado}: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
      await capturar(page, `${rota}-${estado}-${largura}.png`)
    }
  } finally {
    await contexto.close()
  }
}

try {
  await fetch(`${BASE}/`)
} catch {
  console.error(`Servidor não respondeu em ${BASE}. Rode antes: pnpm build:verificacao && pnpm start:verificacao`)
  process.exit(1)
}
mkdirSync(PASTA, { recursive: true })
console.log(`Capturas em ${path.relative(RAIZ, PASTA)}:`)

const navegador = await chromium.launch({ channel: 'chromium', args: GPU })
try {
  const contexto = await navegador.newContext(CELULAR)
  const page = await contexto.newPage()
  await page.goto(`${BASE}/`)
  await capturar(page, 'index-390.png')
  await contexto.close()

  for (const rota of ROTAS) {
    for (const { largura, opcoes } of largurasDe(rota)) {
      try {
        await capturarRota(navegador, rota, largura, opcoes)
      } catch (erro) {
        falhas.push(`/${rota} ${largura}: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
    }
  }

  for (const rota of ROTAS) {
    const foco = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
    const pagina = await foco.newPage()
    await pagina.goto(`${BASE}/${rota}`)
    await esperarPagina(pagina, rota, `/${rota} foco`)
    for (let i = 0; i < 3; i++) await pagina.keyboard.press('Tab')
    await pagina.waitForTimeout(300)
    await capturar(pagina, `${rota}-foco-1440.png`)
    await foco.close()
  }
} finally {
  await navegador.close()
}

const semWebgl = await chromium.launch({ channel: 'chromium', args: ['--disable-3d-apis'] })
try {
  for (const rota of ROTAS.filter((r) => !ehExploracao(r))) {
    const { largura, opcoes } = celularDe(rota)
    const contexto = await semWebgl.newContext(opcoes)
    const page = await contexto.newPage()
    await page.goto(`${BASE}/${rota}`)
    await page.waitForTimeout(1500)
    const render = await page.evaluate(() => document.querySelector('[data-render]')?.getAttribute('data-render') ?? null)
    if (render !== 'css') avisos.push(`/${rota} sem WebGL: data-render="${render}" (esperado "css")`)
    await capturar(page, `${rota}-semwebgl-${largura}.png`)
    await contexto.close()
  }
} finally {
  await semWebgl.close()
}

const esperados = ROTAS.flatMap((rota) =>
  ESTADOS.flatMap((estado) => largurasDe(rota).map(({ largura }) => `${rota}-${estado}-${largura}.png`)),
)
const ausentes = esperados.filter((nome) => !existsSync(path.join(PASTA, nome)))
console.log(
  `\n${gerados.length} arquivos gravados; ${esperados.length - ausentes.length} de ${esperados.length} capturas por estado presentes (9 da Mesa e 6 da Sinapse).`,
)
for (const aviso of avisos) console.log(`Aviso: ${aviso}`)
for (const falha of falhas) console.log(`Falha: ${falha}`)
if (ausentes.length > 0) console.log(`Ausentes: ${ausentes.join(', ')}`)
if (ausentes.length > 0 || falhas.length > 0) process.exitCode = 1
