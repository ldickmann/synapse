// Critérios gerais do SPEC §8.1 (G2–G7, G10, G12–G19), contra `pnpm start:verificacao`.
// Uso: PORTA=3000 pnpm exec playwright test tests/geral.spec.ts
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type BrowserContextOptions, type BrowserType, type Page } from '@playwright/test'
import { linkWhatsApp } from '../lib/contato.ts'
import { PERGUNTAS } from '../lib/oferta.ts'

// A rota de venda (Mesa) segue o §8; a de exploração (Sinapse) segue o §11.
const ROTAS_VENDA = ['mesa'] as const
const ROTAS_EXPLORACAO = ['sinapse'] as const
const ROTAS = [...ROTAS_VENDA, ...ROTAS_EXPLORACAO] as const
// Rotas com canvas WebGL (a Sinapse desenha em canvas 2D).
const ROTAS_WEBGL = ['mesa'] as const

type RotaVenda = (typeof ROTAS_VENDA)[number]
type RotaExploracao = (typeof ROTAS_EXPLORACAO)[number]
type Rota = RotaVenda | RotaExploracao

const ehVenda = (rota: Rota): rota is RotaVenda => (ROTAS_VENDA as readonly string[]).includes(rota)
const ehExploracao = (rota: Rota): rota is RotaExploracao => (ROTAS_EXPLORACAO as readonly string[]).includes(rota)

const CAPTURAS = path.resolve(import.meta.dirname, '..', 'verificacao', 'screenshots')
mkdirSync(CAPTURAS, { recursive: true })
const captura = (nome: string) => path.join(CAPTURAS, nome)

const CELULAR = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}
// Nas direções de exploração a primeira tela vale também em 375×667 (SPEC §11).
const CELULAR_375 = { ...CELULAR, viewport: { width: 375, height: 667 } }
const DESKTOP = { viewport: { width: 1440, height: 900 } }
const ESPERA_3D = 30_000
// Código que só existe no chunk da cena (three e R3F).
const MARCAS_3D = /WebGLRenderer|__THREE__|__r3f|@react-three\/fiber/

// Textos-chave do SPEC §4.x.2 de cada rota (h1, apoio, títulos de seção, contato, rodapé, FAQ).
const COMUNS = [
  'Perguntas que sempre aparecem',
  'Me conta o que o seu negócio precisa. Eu respondo pelo WhatsApp.',
  'Lucas Elias Dickmann, desenvolvedor front-end. Navegantes, SC.',
  ...PERGUNTAS.map((p) => p.pergunta),
]
const TEXTOS: Record<RotaVenda, { h1: string; outros: string[] }> = {
  mesa: {
    h1: 'Um site é feito de partes simples.',
    outros: [
      'Pegue um cartão na mesa e veja o que cada parte faz pelo seu negócio. Faço sites, sistemas sob medida e manutenção, em Navegantes e à distância para todo o Brasil.',
      'As partes do site',
      'O que eu faço',
      'Quem monta',
      'Trabalhos',
      'Vamos conversar?',
      ...COMUNS,
    ],
  },
}

const semEspacos = (texto: string) => texto.replace(/\s+/g, '')

function coletarErros(page: Page): string[] {
  const erros: string[] = []
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(`console.error: ${mensagem.text()}`)
  })
  page.on('pageerror', (erro) => erros.push(`pageerror: ${erro.message}`))
  return erros
}

/** Rotas de exploração sem WebGL (direção 10, Sinapse): o invólucro fica em data-render="css" e não há 3D a esperar. */
const ROTAS_SEM_3D = ['sinapse'] as const

async function esperar3d(page: Page): Promise<void> {
  if (ROTAS_SEM_3D.some((rota) => new URL(page.url()).pathname === `/${rota}`)) return
  await page.locator('[data-render="3d"]').waitFor({ timeout: ESPERA_3D })
}

/** Para testes que não são de 3D: deixa o 3D entrar se houver, sem falhar se não entrar. */
async function esperar3dSeHouver(page: Page): Promise<void> {
  if ((await page.locator('[data-render]').count()) === 0) return
  await page
    .locator('[data-render="3d"]')
    .waitFor({ timeout: ESPERA_3D })
    .catch(() => undefined)
}

/**
 * Versão sem WebGL: Chromium iniciado com --disable-3d-apis. O Playwright não aceita
 * `test.use({ launchOptions })` dentro de describe, então o navegador é aberto aqui.
 */
async function semWebgl(
  browserType: BrowserType,
  opcoes: BrowserContextOptions,
  corpo: (page: Page) => Promise<void>,
): Promise<void> {
  const navegador = await browserType.launch({ channel: 'chromium', args: ['--disable-3d-apis'] })
  try {
    const contexto = await navegador.newContext(opcoes)
    await corpo(await contexto.newPage())
  } finally {
    await navegador.close()
  }
}

async function conferirTextos(page: Page, rota: RotaVenda): Promise<void> {
  await expect(page.locator('h1')).toHaveCount(1)
  const h1 = (await page.locator('h1').textContent()) ?? ''
  expect(semEspacos(h1), 'texto do h1').toBe(semEspacos(TEXTOS[rota].h1))
  const corpo = semEspacos(await page.evaluate(() => document.body.textContent ?? ''))
  const faltando = TEXTOS[rota].outros.filter((texto) => !corpo.includes(semEspacos(texto)))
  expect(faltando, 'textos do SPEC ausentes do DOM').toEqual([])
}

async function conferirLinksWhatsApp(page: Page, minimo: number): Promise<void> {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => /wa\.me|whatsapp\.com/i.test(href)),
  )
  const waMe = hrefs.filter((href) => href.startsWith('https://wa.me/'))
  expect(waMe.length, 'links https://wa.me/ na rota').toBeGreaterThanOrEqual(minimo)
  expect(hrefs.filter((href) => href !== linkWhatsApp()), 'links de WhatsApp diferentes de linkWhatsApp()').toEqual([])
}

/** Algum elemento do seletor está visível e inteiro dentro da viewport. */
async function algumDentroDaViewport(page: Page, seletor: string): Promise<boolean> {
  return page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).some((el) => {
      const r = el.getBoundingClientRect()
      const visivel = el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      return (
        visivel &&
        r.width > 0 &&
        r.height > 0 &&
        r.left >= -0.5 &&
        r.top >= -0.5 &&
        r.right <= innerWidth + 0.5 &&
        r.bottom <= innerHeight + 0.5
      )
    })
  }, seletor)
}

test.describe('G2 página inicial', () => {
  test.use(CELULAR)
  test('G2 / lista as duas versões com links para /mesa e /sinapse', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Duas versões')
    for (const rota of ROTAS) await expect(page.locator(`a[href="/${rota}"]`).first()).toBeVisible()
    await page.screenshot({ path: captura('index-390.png') })
    for (const rota of ROTAS) {
      await page.goto('/')
      await page.locator(`a[href="/${rota}"]`).first().click()
      await page.waitForURL(`**/${rota}`)
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})

for (const [tela, opcoes, rotas] of [
  ['390×844', CELULAR, ROTAS_WEBGL],
  ['375×667', CELULAR_375, ROTAS_WEBGL.filter(ehExploracao)],
] as const) {
  test.describe(`G3 primeira tela sem o 3D (${tela})`, () => {
    test.use(opcoes)
    const sufixo = tela === '390×844' ? '' : ` (${tela})`
    for (const rota of rotas) {
      test(`G3 ${rota}: monograma, h1 e whatsapp-hero na viewport com o chunk da cena bloqueado${sufixo}`, async ({ page }) => {
        const bloqueados: string[] = []
        await page.route('**/*cena*', (route) => route.abort())
        await page.route(
          (url) => url.pathname.endsWith('.js'),
          async (route) => {
            const resposta = await route.fetch()
            if (MARCAS_3D.test(await resposta.text())) {
              bloqueados.push(route.request().url())
              return route.abort()
            }
            return route.fulfill({ response: resposta })
          },
        )
        await page.goto(`/${rota}`)
        await page.waitForTimeout(1500)
        console.log(`G3 ${rota}: ${bloqueados.length} chunk(s) de 3D bloqueado(s)`)
        await expect(page.locator('[data-render="3d"]')).toHaveCount(0)
        for (const seletor of ['svg[data-monograma="dLK"]', 'h1', '[data-testid="whatsapp-hero"]']) {
          await expect
            .poll(() => algumDentroDaViewport(page, seletor), { message: `${seletor} visível dentro da viewport`, timeout: 5000 })
            .toBe(true)
        }
        await page.screenshot({ path: captura(`${rota}-hero-sem3d-${opcoes.viewport.width}.png`) })
      })
    }
  })
}

test.describe('G4 links de WhatsApp (3D)', () => {
  for (const rota of ROTAS) {
    test(`G4 ${rota}: todos os links iguais a linkWhatsApp(), mínimo ${ehVenda(rota) ? 3 : 1}`, async ({ page }) => {
      await page.goto(`/${rota}`)
      await esperar3d(page)
      await conferirLinksWhatsApp(page, ehVenda(rota) ? 3 : 1)
    })
  }
})

test.describe('G4 links de WhatsApp (sem WebGL)', () => {
  for (const rota of ROTAS) {
    test(`G4 ${rota} sem WebGL: todos os links iguais a linkWhatsApp(), mínimo ${ehVenda(rota) ? 3 : 1}`, async ({
      playwright,
      baseURL,
    }) => {
      await semWebgl(playwright.chromium, { ...DESKTOP, baseURL }, async (page) => {
        await page.goto(`/${rota}`)
        await page.waitForTimeout(1000)
        await expect(page.locator('[data-render]')).toHaveAttribute('data-render', 'css')
        await conferirLinksWhatsApp(page, ehVenda(rota) ? 3 : 1)
      })
    })
  }
})

test.describe('G5 versão sem WebGL (390×844, --disable-3d-apis)', () => {
  for (const rota of ROTAS_VENDA) {
    test(`G5 ${rota}: sem canvas, data-render="css" e o texto do SPEC`, async ({ playwright, baseURL }) => {
      await semWebgl(playwright.chromium, { ...CELULAR, baseURL }, async (page) => {
        await page.goto(`/${rota}`)
        await page.waitForTimeout(1500)
        await expect(page.locator('[data-render]')).toHaveCount(1)
        await expect(page.locator('[data-render]')).toHaveAttribute('data-render', 'css')
        await expect(page.locator('canvas')).toHaveCount(0)
        if (ehVenda(rota)) await conferirTextos(page, rota)
        else await expect(page.locator('h1')).toHaveCount(1)
        await page.screenshot({ path: captura(`${rota}-semwebgl-390.png`) })
      })
    })
  }
})

test.describe('G5 mesmo texto na versão 3D (390×844)', () => {
  test.use(CELULAR)
  for (const rota of ROTAS_VENDA) {
    test(`G5 ${rota} com 3D: o mesmo texto do SPEC`, async ({ page }) => {
      await page.goto(`/${rota}`)
      await esperar3d(page)
      await conferirTextos(page, rota)
    })
  }
})

test.describe('G6 perda de contexto WebGL', () => {
  for (const rota of ROTAS_WEBGL) {
    test(`G6 ${rota}: loseContext() sem restauração volta para CSS sem erro`, async ({ page }) => {
      const erros = coletarErros(page)
      await page.goto(`/${rota}`)
      await esperar3d(page)
      const resultado = await page.evaluate(() => {
        const canvas = document.querySelector('[data-render] canvas') ?? document.querySelector('canvas')
        if (!(canvas instanceof HTMLCanvasElement)) return 'sem canvas'
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
        const extensao = gl?.getExtension('WEBGL_lose_context')
        if (!extensao) return 'sem WEBGL_lose_context'
        extensao.loseContext()
        return 'ok'
      })
      expect(resultado).toBe('ok')
      await page.waitForTimeout(2500)
      await expect(page.locator('[data-render]')).toHaveAttribute('data-render', 'css', { timeout: 2000 })
      await expect(page.locator('canvas')).toHaveCount(0)
      expect(erros).toEqual([])
    })
  }
})

test.describe('G7 movimento reduzido', () => {
  test.use({ ...CELULAR, reducedMotion: 'reduce' })
  for (const rota of ROTAS) {
    test(`G7 ${rota}: data-motion="reduzido" e duas capturas com 3 s de intervalo quase iguais`, async ({
      page,
      context,
    }, testInfo) => {
      await page.goto(`/${rota}`)
      await expect(page.locator('[data-motion="reduzido"]').first()).toBeAttached()
      await esperar3d(page)
      await page.waitForTimeout(1000)
      // Reinicia a contagem da dica inativa para ela não aparecer entre as capturas.
      await page.keyboard.press('Shift')
      // Os robôs da Sinapse continuam se mexendo com movimento reduzido (exceção do X4): ficam fora da comparação.
      const mask = [page.locator('.sinapse-robo'), page.locator('.sinapse-operador-faisca')]
      const antes = await page.screenshot({ mask })
      await page.waitForTimeout(3000)
      const depois = await page.screenshot({ mask })
      await testInfo.attach('antes', { body: antes, contentType: 'image/png' })
      await testInfo.attach('depois', { body: depois, contentType: 'image/png' })

      const comparador = await context.newPage()
      const fracao = await comparador.evaluate(
        async ({ a, b }) => {
          const carregar = (base64: string) =>
            new Promise<HTMLImageElement>((resolver, rejeitar) => {
              const imagem = new Image()
              imagem.onload = () => resolver(imagem)
              imagem.onerror = rejeitar
              imagem.src = `data:image/png;base64,${base64}`
            })
          const [ia, ib] = await Promise.all([carregar(a), carregar(b)])
          const largura = ia.naturalWidth
          const altura = ia.naturalHeight
          if (largura !== ib.naturalWidth || altura !== ib.naturalHeight) return 1
          const canvas = document.createElement('canvas')
          canvas.width = largura
          canvas.height = altura
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return 1
          ctx.drawImage(ia, 0, 0)
          const da = ctx.getImageData(0, 0, largura, altura).data
          ctx.clearRect(0, 0, largura, altura)
          ctx.drawImage(ib, 0, 0)
          const db = ctx.getImageData(0, 0, largura, altura).data
          let diferentes = 0
          for (let i = 0; i < da.length; i += 4) {
            if (
              Math.abs(da[i] - db[i]) > 16 ||
              Math.abs(da[i + 1] - db[i + 1]) > 16 ||
              Math.abs(da[i + 2] - db[i + 2]) > 16 ||
              Math.abs(da[i + 3] - db[i + 3]) > 16
            ) {
              diferentes++
            }
          }
          return diferentes / (largura * altura)
        },
        { a: antes.toString('base64'), b: depois.toString('base64') },
      )
      await comparador.close()
      console.log(`G7 ${rota}: ${(fracao * 100).toFixed(3)} % dos pixels diferentes`)
      expect(fracao).toBeLessThan(0.005)
    })
  }
})

test.describe('G10 orçamento de transferência e de JS (390×844)', () => {
  test.use(CELULAR)
  for (const rota of ROTAS) {
    test(`G10 ${rota}: total ≤ 900 kB, JS inicial ≤ 200 kB, JS depois do HTML ≤ 350 kB`, async ({ page }) => {
      type Registro = { url: string; corpo: number; total: number; codificacao: string }
      const registros: Registro[] = []
      const pendentes: Promise<void>[] = []
      page.on('requestfinished', (requisicao) => {
        pendentes.push(
          (async () => {
            const tamanhos = await requisicao.sizes()
            const cabecalhos = (await requisicao.response())?.headers() ?? {}
            registros.push({
              url: requisicao.url(),
              corpo: tamanhos.responseBodySize,
              total: tamanhos.responseBodySize + tamanhos.responseHeadersSize,
              codificacao: cabecalhos['content-encoding'] ?? '',
            })
          })(),
        )
      })
      const navegacao = await page.goto(`/${rota}`)
      expect(navegacao, 'resposta da navegação').not.toBeNull()
      const html = await navegacao!.text()
      await esperar3d(page)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await Promise.all(pendentes)

      // Scripts referenciados no HTML inicial (<script src> e <link rel=preload|modulepreload as=script>).
      const iniciais = new Set<string>()
      for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
        const atributo = (nome: string) => tag.match(new RegExp(`\\s${nome}="([^"]*)"`, 'i'))?.[1]?.replace(/&amp;/g, '&')
        const ehLink = /^<link/i.test(tag)
        if (ehLink && !(atributo('as') === 'script' || atributo('rel') === 'modulepreload')) continue
        // <script nomodule> (polyfills) não é baixado por navegador moderno.
        if (!ehLink && /\snomodule\b/i.test(tag)) continue
        const endereco = ehLink ? atributo('href') : atributo('src')
        if (!endereco) continue
        const url = new URL(endereco, page.url())
        if (url.pathname.endsWith('.js')) iniciais.add(url.href)
      }
      const ehJs = (url: string) => new URL(url).pathname.endsWith('.js')
      const porUrl = new Map(registros.map((r) => [r.url, r]))
      const naoCarregados = [...iniciais].filter((url) => !porUrl.has(url))
      const jsInicial = [...iniciais].reduce((soma, url) => soma + (porUrl.get(url)?.corpo ?? 0), 0)
      const tardios = registros.filter((r) => ehJs(r.url) && !iniciais.has(r.url))
      const jsDepois = tardios.reduce((soma, r) => soma + r.corpo, 0)
      const total = registros.reduce((soma, r) => soma + r.total, 0)
      const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`
      const codificacoes = [...new Set(registros.filter((r) => ehJs(r.url)).map((r) => r.codificacao || 'nenhuma'))]
      console.log(
        `G10 ${rota}: transferência total ${kb(total)} (${registros.length} respostas); ` +
          `JS inicial ${kb(jsInicial)} (${iniciais.size} arquivos); JS depois do HTML ${kb(jsDepois)} (${tardios.length} arquivos); ` +
          `codificação do JS: ${codificacoes.join(', ')}`,
      )
      expect(naoCarregados, 'scripts do HTML inicial que o navegador não baixou').toEqual([])
      expect(total, 'transferência total (bytes)').toBeLessThanOrEqual(900_000)
      expect(jsInicial, 'JS inicial codificado (bytes)').toBeLessThanOrEqual(200_000)
      expect(jsDepois, 'JS carregado depois do HTML (bytes)').toBeLessThanOrEqual(350_000)
    })
  }
})

test.describe('G12 foco visível (1440)', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS) {
    test(`G12 ${rota}: outline ≥ 3 px em 5 elementos focados com Tab`, async ({ page }) => {
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      type Foco = { id: number; descricao: string; largura: number; estilo: string }
      const focados: Foco[] = []
      for (let i = 0; i < 40 && focados.length < 5; i++) {
        await page.keyboard.press('Tab')
        const foco = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body || el === document.documentElement) return null
          const estilo = getComputedStyle(el)
          const texto = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
          return {
            id: Array.from(document.querySelectorAll('*')).indexOf(el),
            descricao: `<${el.tagName.toLowerCase()}> ${texto}`,
            largura: Number.parseFloat(estilo.outlineWidth),
            estilo: estilo.outlineStyle,
          }
        })
        if (foco && !focados.some((f) => f.id === foco.id)) focados.push(foco)
      }
      await page.screenshot({ path: captura(`${rota}-foco-1440.png`) })
      expect(focados.length, 'elementos focados com Tab').toBeGreaterThanOrEqual(5)
      for (const foco of focados) {
        expect(foco.largura, `outline-width de ${foco.descricao}`).toBeGreaterThanOrEqual(3)
        expect(foco.estilo, `outline-style de ${foco.descricao}`).not.toBe('none')
      }
    })
  }
})

test.describe('G13 metadados e imagem de prévia', () => {
  for (const rota of ROTAS_VENDA) {
    test(`G13 ${rota}: og:title, og:description, og:image 1200×630 PNG e twitter:card`, async ({ page, baseURL }) => {
      await page.goto(`/${rota}`)
      const metas = await page.evaluate(() => {
        const ler = (seletor: string) => document.querySelector(seletor)?.getAttribute('content') ?? null
        return {
          titulo: ler('meta[property="og:title"]'),
          descricao: ler('meta[property="og:description"]'),
          imagem: ler('meta[property="og:image"]'),
          cartao: ler('meta[name="twitter:card"]'),
        }
      })
      expect(metas.titulo, 'og:title').toBeTruthy()
      expect(metas.descricao, 'og:description').toBeTruthy()
      expect(metas.cartao, 'twitter:card').toBeTruthy()
      expect(metas.imagem, 'og:image').toBeTruthy()
      // A og:image usa metadataBase; o teste baixa do servidor em teste.
      const original = new URL(metas.imagem!, baseURL)
      const resposta = await page.request.get(new URL(original.pathname + original.search, baseURL).href)
      expect(resposta.status()).toBe(200)
      expect(resposta.headers()['content-type']).toMatch(/^image\/png/)
      const png = await resposta.body()
      expect(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'assinatura PNG').toBe(true)
      expect(png.toString('ascii', 12, 16)).toBe('IHDR')
      expect({ largura: png.readUInt32BE(16), altura: png.readUInt32BE(20) }).toEqual({ largura: 1200, altura: 630 })
    })
  }
})

test.describe('G14 fontes self-hosted', () => {
  for (const rota of ROTAS) {
    test(`G14 ${rota}: nenhuma requisição a fonts.googleapis.com ou fonts.gstatic.com`, async ({ page }) => {
      const externas: string[] = []
      page.on('request', (requisicao) => {
        const url = requisicao.url()
        if (/^https?:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(url)) externas.push(url)
      })
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      await page.waitForLoadState('networkidle')
      expect(externas).toEqual([])
    })
  }
})

test.describe('G15 rolagem nativa', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS) {
    test(`G15 ${rota}: mouse.wheel rola, sem preventDefault em wheel/touchmove, body sem overflow hidden`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const registro: string[] = []
        ;(window as unknown as { __preventDefaultRolagem: string[] }).__preventDefaultRolagem = registro
        const original = Event.prototype.preventDefault
        Event.prototype.preventDefault = function (this: Event) {
          if (this.type === 'wheel' || this.type === 'mousewheel' || this.type === 'touchmove') registro.push(this.type)
          return original.call(this)
        }
      })
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      const antes = await page.evaluate(() => scrollY)
      await page.mouse.move(720, 450)
      await page.mouse.wheel(0, 600)
      await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).not.toBe(antes)
      const registro = await page.evaluate(
        () => (window as unknown as { __preventDefaultRolagem: string[] }).__preventDefaultRolagem,
      )
      expect(registro, 'preventDefault chamado em wheel/touchmove').toEqual([])
      const overflow = await page.evaluate(() => {
        const estilo = getComputedStyle(document.body)
        return { x: estilo.overflowX, y: estilo.overflowY }
      })
      expect(['hidden', 'clip'], 'overflow-x do body').not.toContain(overflow.x)
      expect(['hidden', 'clip'], 'overflow-y do body').not.toContain(overflow.y)
    })
  }
})

test.describe('G16 dica inativa', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS_VENDA) {
    test(`G16 ${rota}: aparece após 4 s parado e some de vez no primeiro scroll`, async ({ page }) => {
      const dica = page.locator('[data-testid="dica"]')
      // O tempo conta do início da navegação (performance.now()).
      await page.goto(`/${rota}`, { waitUntil: 'commit' })
      await page.waitForFunction(() => performance.now() >= 3500, null, { timeout: 15_000 })
      expect(await dica.count(), 'dica antes de 4 s').toBe(0)
      await page.waitForFunction(() => performance.now() >= 4500, null, { timeout: 15_000 })
      await expect(dica.first(), 'dica depois de 4 s parado').toBeVisible({ timeout: 1000 })
      await page.mouse.move(720, 450)
      await page.mouse.wheel(0, 300)
      await expect(dica, 'dica depois do scroll').toHaveCount(0, { timeout: 2000 })
      await page.waitForTimeout(5000)
      expect(await dica.count(), 'dica 5 s depois do scroll').toBe(0)
    })
  }
})

for (const [largura, opcoes] of [
  [390, CELULAR],
  [1440, DESKTOP],
] as const) {
  test.describe(`G17 botão fixo (${largura})`, () => {
    test.use(opcoes)
    for (const rota of ROTAS_VENDA) {
      test(`G17 ${rota} ${largura}: aparece depois da segunda seção e não cobre o botão final`, async ({ page }) => {
        await page.goto(`/${rota}`)
        await esperar3dSeHouver(page)
        const fixo = page.locator('[data-testid="botao-fixo"]').first()
        await expect(fixo).toHaveAttribute('data-visivel', 'false')
        const alvo = await page.evaluate(() => {
          const secao = document.querySelector('[data-secao="2"]')
          if (!secao) return null
          const topo = secao.getBoundingClientRect().top + scrollY
          return Math.max(0, topo - innerHeight / 2 + 40)
        })
        expect(alvo, '[data-secao="2"] existe').not.toBeNull()
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), alvo!)
        await expect(fixo).toHaveAttribute('data-visivel', 'true', { timeout: 3000 })

        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
        await page.waitForTimeout(1000)
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
        await page.waitForTimeout(500)
        const final = page.locator('[data-testid="whatsapp-final"]').filter({ visible: true }).first()
        await expect(final).toBeVisible()
        if ((await fixo.getAttribute('data-visivel')) === 'false') {
          // Oculto (visibility: hidden) não cobre nada; confere que está mesmo oculto.
          expect(await fixo.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden')
          return
        }
        const a = await fixo.boundingBox()
        const b = await final.boundingBox()
        expect(a && b, 'caixas do botão fixo e do botão final').toBeTruthy()
        const largo = Math.max(0, Math.min(a!.x + a!.width, b!.x + b!.width) - Math.max(a!.x, b!.x))
        const alto = Math.max(0, Math.min(a!.y + a!.height, b!.y + b!.height) - Math.max(a!.y, b!.y))
        expect(largo * alto, 'área de interseção entre botao-fixo e whatsapp-final').toBe(0)
      })
    }
  })
}

test('G18 monograma dLK em todas as rotas, com cor diferente em cada', async ({ page }) => {
  const cores: Record<string, string> = {}
  for (const rota of ROTAS) {
    await page.goto(`/${rota}`)
    const monograma = page.locator('svg[data-monograma="dLK"]').first()
    await expect(monograma, `monograma em /${rota}`).toBeAttached()
    cores[rota] = await monograma.evaluate((el) => getComputedStyle(el).color)
  }
  expect(new Set(Object.values(cores)).size, `cores: ${JSON.stringify(cores)}`).toBe(ROTAS.length)
})

// Direções de exploração (SPEC §11): X1 a X4.

type TextoDoMain = { visivel: string; porNo: string; oculto: string; h1: number }

/**
 * Texto de `main` fora dos nós aria-hidden (como textContent), o mesmo texto com um espaço entre nós
 * (para separar palavras de elementos vizinhos) e o texto dentro dos nós aria-hidden, com espaços normalizados.
 */
async function textoDoMain(page: Page): Promise<TextoDoMain> {
  return page.evaluate(() => {
    let visivel = ''
    let porNo = ''
    let oculto = ''
    const andar = (no: Node, dentroOculto: boolean) => {
      if (no.nodeType === Node.TEXT_NODE) {
        const texto = no.textContent ?? ''
        if (dentroOculto) oculto += `${texto} `
        else {
          visivel += texto
          porNo += `${texto} `
        }
        return
      }
      if (!(no instanceof Element) || ['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'].includes(no.tagName)) return
      const oculta = dentroOculto || no.getAttribute('aria-hidden') === 'true'
      for (const filho of Array.from(no.childNodes)) andar(filho, oculta)
    }
    const main = document.querySelector('main')
    if (main) andar(main, false)
    const normalizar = (texto: string) => texto.replace(/\s+/g, ' ').trim()
    return {
      visivel: normalizar(visivel),
      porNo: normalizar(porNo),
      oculto: normalizar(oculto),
      h1: document.querySelectorAll('h1').length,
    }
  })
}

const palavras = (texto: string) => new Set(texto.toLocaleLowerCase('pt-BR').match(/[\p{L}\p{N}]+/gu) ?? [])

async function esperarHidratacao(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

for (const [tela, opcoes] of [
  ['375×667', CELULAR_375],
  ['390×844', CELULAR],
] as const) {
  test.describe(`X1 primeira tela e largura (${tela})`, () => {
    test.use(opcoes)
    for (const rota of ROTAS_EXPLORACAO) {
      test(`X1 ${rota} ${tela}: monograma, h1 e whatsapp-hero sem rolar, e nada passa da largura`, async ({ page }) => {
        await page.goto(`/${rota}`)
        await esperar3dSeHouver(page)
        for (const seletor of ['svg[data-monograma="dLK"]', 'h1', '[data-testid="whatsapp-hero"]']) {
          expect(await algumDentroDaViewport(page, seletor), `${seletor} visível dentro da viewport`).toBe(true)
        }
        // Rola até o fim em passos, para montar o que entra por IntersectionObserver.
        const altura = await page.evaluate(() => document.documentElement.scrollHeight)
        for (let y = 0; y <= altura; y += opcoes.viewport.height / 2) {
          await page.evaluate((topo) => window.scrollTo({ top: topo, behavior: 'instant' }), y)
          await page.waitForTimeout(100)
        }
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
        await page.waitForTimeout(500)
        const largura = await page.evaluate(() => ({ rolagem: document.documentElement.scrollWidth, janela: innerWidth }))
        expect(largura.rolagem, `scrollWidth com janela de ${largura.janela} px`).toBeLessThanOrEqual(largura.janela)
      })
    }
  })
}

test.describe('X2 hover e foco levam ao mesmo estado (1440)', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X2 ${rota}: todo [data-efeito] chega a data-ativo="true" por hover e por foco com Tab`, async ({ page }) => {
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      // Até 8 elementos com efeito, na ordem do documento, marcados para o Tab achar os mesmos.
      const total = await page.evaluate(() => {
        const visiveis = Array.from(document.querySelectorAll('[data-efeito]')).filter((el) =>
          el.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        )
        visiveis.slice(0, 8).forEach((el, i) => el.setAttribute('data-x2', String(i)))
        return Math.min(visiveis.length, 8)
      })
      expect(total, '[data-efeito] visíveis').toBeGreaterThan(0)
      for (let i = 0; i < total; i++) {
        const alvo = page.locator(`[data-x2="${i}"]`)
        await alvo.hover()
        await expect(alvo, `hover no [data-efeito] ${i}`).toHaveAttribute('data-ativo', 'true')
      }
      await page.mouse.move(1, 1)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const focados = new Set<string>()
      for (let passo = 0; passo < 80 && focados.size < total; passo++) {
        await page.keyboard.press('Tab')
        const indice = await page.evaluate(() => document.activeElement?.getAttribute('data-x2') ?? null)
        if (indice === null || focados.has(indice)) continue
        await expect(page.locator(`[data-x2="${indice}"]`), `foco com Tab no [data-efeito] ${indice}`).toHaveAttribute(
          'data-ativo',
          'true',
        )
        focados.add(indice)
      }
      expect(focados.size, '[data-efeito] alcançados com Tab').toBe(total)
    })
  }
})

test.describe('X3 paridade de texto (1440)', () => {
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X3 ${rota}: o texto de main sem aria-hidden é o mesmo em 3D, sem WebGL, com movimento reduzido e sem JavaScript`, async ({
      browser,
      playwright,
      baseURL,
    }) => {
      const ler = async (opcoes: BrowserContextOptions, esperar: (page: Page) => Promise<void>) => {
        const contexto = await browser.newContext({ ...DESKTOP, baseURL, ...opcoes })
        try {
          const page = await contexto.newPage()
          await page.goto(`/${rota}`)
          await esperar(page)
          return await textoDoMain(page)
        } finally {
          await contexto.close()
        }
      }
      const textos: Record<string, TextoDoMain> = {}
      textos['3D'] = await ler({}, async (page) => {
        await esperar3d(page)
        await esperarHidratacao(page)
      })
      textos['movimento reduzido'] = await ler({ reducedMotion: 'reduce' }, async (page) => {
        await esperar3dSeHouver(page)
        await esperarHidratacao(page)
      })
      textos['sem JavaScript'] = await ler({ javaScriptEnabled: false }, async () => undefined)
      await semWebgl(playwright.chromium, { ...DESKTOP, baseURL }, async (page) => {
        await page.goto(`/${rota}`)
        await esperarHidratacao(page)
        await expect(page.locator('[data-render]')).toHaveAttribute('data-render', 'css')
        textos['sem WebGL'] = await textoDoMain(page)
      })

      expect(textos['3D'].visivel.length, 'texto de main no modo 3D').toBeGreaterThan(0)
      for (const [modo, texto] of Object.entries(textos)) {
        expect(texto.h1, `h1 (${modo})`).toBe(1)
        expect(texto.visivel, `texto de main (${modo})`).toBe(textos['3D'].visivel)
        const visiveis = palavras(texto.porNo)
        const soOcultas = [...palavras(texto.oculto)].filter((palavra) => !visiveis.has(palavra))
        expect(soOcultas, `palavras que só existem em nós aria-hidden (${modo})`).toEqual([])
      }
    })
  }
})

test.describe('X4 movimento reduzido: página estática e completa (1440)', () => {
  test.use({ ...DESKTOP, reducedMotion: 'reduce' })
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X4 ${rota}: todas as section visíveis e o mesmo texto da página sem JavaScript`, async ({
      page,
      browser,
      baseURL,
    }) => {
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      await expect(page.locator('[data-motion="reduzido"]').first()).toBeAttached()
      const secoes = page.locator('section')
      const total = await secoes.count()
      expect(total, 'seções da página').toBeGreaterThanOrEqual(3)
      for (let i = 0; i < total; i++) {
        const secao = secoes.nth(i)
        await secao.scrollIntoViewIfNeeded()
        await expect(secao, `section ${i}`).toBeVisible()
        const visivel = await secao.evaluate((el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
        expect(visivel, `section ${i} sem opacidade 0 nem visibility hidden`).toBe(true)
      }
      const reduzido = await textoDoMain(page)
      const contexto = await browser.newContext({ ...DESKTOP, baseURL, javaScriptEnabled: false })
      try {
        const semJs = await contexto.newPage()
        await semJs.goto(`/${rota}`)
        expect(reduzido.visivel, 'texto de main com movimento reduzido').toBe((await textoDoMain(semJs)).visivel)
      } finally {
        await contexto.close()
      }
    })
  }
})

for (const rota of ['', ...ROTAS]) {
  test(`G19 /${rota}: html[lang="pt-BR"]`, async ({ page }) => {
    await page.goto(`/${rota}`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  })
}

// ---------- Rotas de exploração (SPEC §11): X1 a X4 ----------

/** Texto de `main` sem os nós `aria-hidden`, com espaços normalizados. */
async function textoVisivel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return ''
    const copia = main.cloneNode(true) as HTMLElement
    copia.querySelectorAll('[aria-hidden="true"]').forEach((no) => no.remove())
    return (copia.textContent ?? '').replace(/\s+/g, ' ').trim()
  })
}

/** Palavras dentro de nós `aria-hidden` que não aparecem no texto fora deles. */
async function palavrasSoNaCamada(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return []
    const copia = main.cloneNode(true) as HTMLElement
    const escondidos = Array.from(copia.querySelectorAll('[aria-hidden="true"]')).map((no) => no.textContent ?? '')
    copia.querySelectorAll('[aria-hidden="true"]').forEach((no) => no.remove())
    const fora = new Set((copia.textContent ?? '').split(/\s+/).filter(Boolean))
    return escondidos.flatMap((texto) => texto.split(/\s+/).filter(Boolean)).filter((palavra) => !fora.has(palavra))
  })
}

for (const [largura, altura] of [
  [375, 667],
  [390, 844],
] as const) {
  test.describe(`X1 sem rolagem horizontal e primeira tela (${largura}×${altura})`, () => {
    test.use({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    for (const rota of ROTAS_EXPLORACAO) {
      test(`X1 ${rota} ${largura}: sem rolagem horizontal; monograma, h1 e whatsapp-hero sem rolar`, async ({ page }) => {
        await page.goto(`/${rota}`)
        await esperar3dSeHouver(page)
        for (const seletor of ['svg[data-monograma="dLK"]', 'h1', '[data-testid="whatsapp-hero"]']) {
          expect(await algumDentroDaViewport(page, seletor), `${seletor} visível dentro da viewport`).toBe(true)
        }
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
        await page.waitForTimeout(300)
        const medidas = await page.evaluate(() => ({ rolagem: document.documentElement.scrollWidth, janela: innerWidth }))
        expect(medidas.rolagem, 'scrollWidth').toBeLessThanOrEqual(medidas.janela)
      })
    }
  })
}

test.describe('X2 efeitos: hover e foco chegam ao mesmo estado (1440)', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X2 ${rota}: até 8 [data-efeito] ficam com data-ativo="true" por hover e por foco com Tab`, async ({ page }) => {
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      // Até 3 de cada tipo de efeito, no máximo 8, na ordem do DOM.
      const alvos = await page.evaluate(() => {
        const porTipo = new Map<string, number>()
        const indices: number[] = []
        Array.from(document.querySelectorAll('[data-efeito]')).forEach((el, i) => {
          const tipo = el.getAttribute('data-efeito') ?? ''
          const usados = porTipo.get(tipo) ?? 0
          if (usados < 3 && indices.length < 8) {
            porTipo.set(tipo, usados + 1)
            indices.push(i)
          }
        })
        return indices
      })
      expect(alvos.length, '[data-efeito] na rota').toBeGreaterThan(0)
      const efeitos = page.locator('[data-efeito]')

      for (const indice of alvos) {
        const el = efeitos.nth(indice)
        await el.scrollIntoViewIfNeeded()
        await el.hover()
        await expect(el, `hover no efeito ${indice}`).toHaveAttribute('data-ativo', 'true')
        await page.mouse.move(0, 0)
        await expect(el, `fim do hover no efeito ${indice}`).toHaveAttribute('data-ativo', 'false')
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.mouse.move(0, 0)
      for (const indice of alvos) {
        const el = efeitos.nth(indice)
        let focado = false
        for (let i = 0; i < 120 && !focado; i++) {
          await page.keyboard.press('Tab')
          focado = await el.evaluate((no) => no === document.activeElement)
        }
        expect(focado, `Tab chega ao efeito ${indice}`).toBe(true)
        await expect(el, `foco no efeito ${indice}`).toHaveAttribute('data-ativo', 'true')
      }
    })
  }
})

test.describe('X3 paridade de texto entre os modos', () => {
  test.use(DESKTOP)
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X3 ${rota}: mesmo texto em 3D, sem WebGL, com movimento reduzido e sem JavaScript`, async ({
      page,
      browser,
      playwright,
      baseURL,
    }) => {
      await page.goto(`/${rota}`)
      await esperar3dSeHouver(page)
      await expect(page.locator('h1')).toHaveCount(1)
      const base = await textoVisivel(page)
      expect(base.length, 'texto de main').toBeGreaterThan(100)
      expect(await palavrasSoNaCamada(page), 'palavras só na camada aria-hidden').toEqual([])

      await semWebgl(playwright.chromium, { ...DESKTOP, baseURL }, async (semGl) => {
        await semGl.goto(`/${rota}`)
        await semGl.waitForTimeout(1000)
        await expect(semGl.locator('h1')).toHaveCount(1)
        expect(await textoVisivel(semGl), 'texto sem WebGL').toBe(base)
      })

      const reduzido = await browser.newContext({ ...DESKTOP, baseURL, reducedMotion: 'reduce' })
      try {
        const paginaReduzida = await reduzido.newPage()
        await paginaReduzida.goto(`/${rota}`)
        await esperar3dSeHouver(paginaReduzida)
        expect(await textoVisivel(paginaReduzida), 'texto com movimento reduzido').toBe(base)
      } finally {
        await reduzido.close()
      }

      const semJs = await browser.newContext({ ...DESKTOP, baseURL, javaScriptEnabled: false })
      try {
        const paginaSemJs = await semJs.newPage()
        await paginaSemJs.goto(`/${rota}`)
        expect(await textoVisivel(paginaSemJs), 'texto sem JavaScript').toBe(base)
      } finally {
        await semJs.close()
      }
    })
  }
})

test.describe('X4 movimento reduzido: página estática e completa (1440)', () => {
  test.use({ ...DESKTOP, reducedMotion: 'reduce' })
  for (const rota of ROTAS_EXPLORACAO) {
    test(`X4 ${rota}: data-motion="reduzido", todas as section visíveis e o mesmo texto do X3`, async ({
      page,
      browser,
      baseURL,
    }) => {
      await page.goto(`/${rota}`)
      await expect(page.locator('[data-motion="reduzido"]').first()).toBeAttached()
      await esperar3dSeHouver(page)
      const visiveis = await page.evaluate(() =>
        Array.from(document.querySelectorAll('section')).map((secao) => {
          const caixa = secao.getBoundingClientRect()
          return secao.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && caixa.width > 0 && caixa.height > 0
        }),
      )
      expect(visiveis.length, 'sections na rota').toBeGreaterThanOrEqual(3)
      expect(visiveis.every(Boolean), `sections visíveis: ${JSON.stringify(visiveis)}`).toBe(true)

      const referencia = await browser.newContext({ ...DESKTOP, baseURL })
      try {
        const paginaReferencia = await referencia.newPage()
        await paginaReferencia.goto(`/${rota}`)
        await esperar3dSeHouver(paginaReferencia)
        expect(await textoVisivel(page), 'texto com movimento reduzido').toBe(await textoVisivel(paginaReferencia))
      } finally {
        await referencia.close()
      }
    })
  }
})
