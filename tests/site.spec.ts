// Critérios de aceite de `/` (docs/especificacao.md §5), contra `pnpm start`.
// Uso: pnpm build && pnpm verificar:testes   (um só: pnpm verificar:testes tests/site.spec.ts -g "X2")
import { expect, test, type BrowserContextOptions, type Page } from '@playwright/test'
import { linkWhatsApp } from '../lib/contato.ts'
import { CELULAR, CELULAR_375, DESKTOP, esperarEntrada } from './comum.ts'

async function conferirLinksWhatsApp(page: Page, minimo: number): Promise<void> {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => /wa\.me|whatsapp\.com/i.test(href)),
  )
  const waMe = hrefs.filter((href) => href.startsWith('https://wa.me/'))
  expect(waMe.length, 'links https://wa.me/ na página').toBeGreaterThanOrEqual(minimo)
  expect(
    hrefs.filter((href) => href !== linkWhatsApp()),
    'links de WhatsApp diferentes de linkWhatsApp()',
  ).toEqual([])
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

test.describe('G4 links de WhatsApp', () => {
  test('G4: todos os links de WhatsApp iguais a linkWhatsApp(), pelo menos 1', async ({ page }) => {
    await page.goto('/')
    await conferirLinksWhatsApp(page, 1)
  })
})

test.describe('G7 movimento reduzido', () => {
  test.use({ ...CELULAR, reducedMotion: 'reduce' })
  test('G7: data-motion="reduzido" e duas capturas com 3 s de intervalo quase iguais', async ({
    page,
    context,
  }, testInfo) => {
    await page.goto('/')
    await expect(page.locator('[data-motion="reduzido"]').first()).toBeAttached()
    await esperarEntrada(page)
    // Os robôs continuam se mexendo com movimento reduzido (exceção do X4): ficam fora da comparação.
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
    console.log(`G7: ${(fracao * 100).toFixed(3)} % dos pixels diferentes`)
    expect(fracao).toBeLessThan(0.005)
  })
})

test.describe('G10 orçamento de transferência e de JS (390×844)', () => {
  test.use(CELULAR)
  test('G10: total ≤ 900 kB, JS inicial ≤ 200 kB, JS depois do HTML ≤ 350 kB', async ({ page }) => {
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
    const navegacao = await page.goto('/')
    expect(navegacao, 'resposta da navegação').not.toBeNull()
    const html = await navegacao!.text()
    await esperarEntrada(page)
    await page.waitForLoadState('networkidle')
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
      `G10: transferência total ${kb(total)} (${registros.length} respostas); ` +
        `JS inicial ${kb(jsInicial)} (${iniciais.size} arquivos); JS depois do HTML ${kb(jsDepois)} (${tardios.length} arquivos); ` +
        `codificação do JS: ${codificacoes.join(', ')}`,
    )
    expect(naoCarregados, 'scripts do HTML inicial que o navegador não baixou').toEqual([])
    expect(total, 'transferência total (bytes)').toBeLessThanOrEqual(900_000)
    expect(jsInicial, 'JS inicial codificado (bytes)').toBeLessThanOrEqual(200_000)
    expect(jsDepois, 'JS carregado depois do HTML (bytes)').toBeLessThanOrEqual(350_000)
  })
})

test.describe('G12 foco visível (1440)', () => {
  test.use(DESKTOP)
  test('G12: outline ≥ 3 px em 5 elementos focados com Tab', async ({ page }, testInfo) => {
    await page.goto('/')
    await esperarEntrada(page)
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
    // Na pasta do teste, em verificacao/test-results/: a foco-1440.png de verificacao/screenshots/ é a do G25.
    await page.screenshot({ path: testInfo.outputPath('foco.png') })
    expect(focados.length, 'elementos focados com Tab').toBeGreaterThanOrEqual(5)
    for (const foco of focados) {
      expect(foco.largura, `outline-width de ${foco.descricao}`).toBeGreaterThanOrEqual(3)
      expect(foco.estilo, `outline-style de ${foco.descricao}`).not.toBe('none')
    }
  })
})

test.describe('G14 fontes self-hosted', () => {
  test('G14: nenhuma requisição a fonts.googleapis.com ou fonts.gstatic.com', async ({ page }) => {
    const externas: string[] = []
    page.on('request', (requisicao) => {
      const url = requisicao.url()
      if (/^https?:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(url)) externas.push(url)
    })
    await page.goto('/')
    await esperarEntrada(page)
    await page.waitForLoadState('networkidle')
    expect(externas).toEqual([])
  })
})

test.describe('G15 rolagem nativa', () => {
  test.use(DESKTOP)
  test('G15: mouse.wheel rola, sem preventDefault em wheel/touchmove, body sem overflow hidden', async ({ page }) => {
    await page.addInitScript(() => {
      const registro: string[] = []
      ;(window as unknown as { __preventDefaultRolagem: string[] }).__preventDefaultRolagem = registro
      const original = Event.prototype.preventDefault
      Event.prototype.preventDefault = function (this: Event) {
        if (this.type === 'wheel' || this.type === 'mousewheel' || this.type === 'touchmove') registro.push(this.type)
        return original.call(this)
      }
    })
    await page.goto('/')
    await esperarEntrada(page)
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
})

test('G19: html[lang="pt-BR"]', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
})

test.describe('G27 cabeçalhos e 404 da exportação', () => {
  test('G27: script de /_next/static com cache imutável e rota inexistente com 404', async ({ request }) => {
    const pagina = await request.get('/')
    expect(pagina.status(), 'status de /').toBe(200)
    const script = (await pagina.text()).match(/<script\b[^>]*\ssrc="(\/_next\/static\/[^"]+\.js)"/i)?.[1]
    expect(script, 'script de /_next/static no HTML de /').toBeDefined()
    const estatico = await request.get(script!)
    expect(estatico.status(), `status de ${script}`).toBe(200)
    // Vem do public/_headers; sem ele, o Pages manda o padrão, max-age=0.
    expect(estatico.headers()['cache-control'], `Cache-Control de ${script}`).toBe(
      'public, max-age=31536000, immutable',
    )
    // Sem o 404.html, o Pages (e o scripts/servir.ts) serve / com 200 em qualquer caminho.
    const inexistente = await request.get('/nao-existe')
    expect(inexistente.status(), 'status de /nao-existe').toBe(404)
    expect(inexistente.headers()['content-type'], 'Content-Type de /nao-existe').toContain('text/html')
  })
})

// Checagens da página (docs/especificacao.md §5): X1 a X4.

for (const [tela, opcoes] of [
  ['375×667', CELULAR_375],
  ['390×844', CELULAR],
] as const) {
  test.describe(`X1 primeira tela e largura (${tela})`, () => {
    test.use(opcoes)
    test(`X1 ${tela}: monograma, h1 e whatsapp-hero sem rolar, e nada passa da largura`, async ({ page }) => {
      await page.goto('/')
      await esperarEntrada(page)
      for (const seletor of ['svg[data-monograma="dLK"]', 'h1', '[data-testid="whatsapp-hero"]']) {
        expect(await algumDentroDaViewport(page, seletor), `${seletor} visível dentro da viewport`).toBe(true)
      }
      // Para em cada seção até o IntersectionObserver revelar o que entra ao rolar; depois, no fim da página.
      const secoes = page.locator('section')
      for (let i = 0; i < (await secoes.count()); i++) {
        await secoes.nth(i).scrollIntoViewIfNeeded()
        await expect(secoes.nth(i), `section ${i} revelada`).not.toHaveAttribute('data-visto', 'false')
      }
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await esperarEntrada(page)
      const largura = await page.evaluate(() => ({ rolagem: document.documentElement.scrollWidth, janela: innerWidth }))
      expect(largura.rolagem, `scrollWidth com janela de ${largura.janela} px`).toBeLessThanOrEqual(largura.janela)
    })
  })
}

test.describe('X2 hover e foco levam ao mesmo estado (1440)', () => {
  test.use(DESKTOP)
  test('X2: todo [data-efeito] fica com data-ativo="true" por hover e por foco com Tab', async ({ page }) => {
    await page.goto('/')
    await esperarEntrada(page)
    const efeitos = page.locator('[data-efeito]')
    const alvos = Array.from({ length: await efeitos.count() }, (_, i) => i)
    expect(alvos.length, '[data-efeito] na página').toBeGreaterThan(0)

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
})

test.describe('X3 paridade de texto (1440)', () => {
  test('X3: o texto de main sem aria-hidden é o mesmo no modo normal, com movimento reduzido e sem JavaScript', async ({
    browser,
    baseURL,
  }) => {
    const ler = async (opcoes: BrowserContextOptions): Promise<TextoDoMain> => {
      const contexto = await browser.newContext({ ...DESKTOP, baseURL, ...opcoes })
      try {
        const page = await contexto.newPage()
        await page.goto('/')
        if (opcoes.javaScriptEnabled !== false) await esperarEntrada(page)
        return await textoDoMain(page)
      } finally {
        await contexto.close()
      }
    }
    const modos: Record<string, TextoDoMain> = {
      normal: await ler({ reducedMotion: 'no-preference' }),
      'movimento reduzido': await ler({ reducedMotion: 'reduce' }),
      'sem JavaScript': await ler({ javaScriptEnabled: false }),
    }

    const base = modos.normal.visivel
    expect(base.length, 'texto de main no modo normal').toBeGreaterThan(100)
    for (const [modo, texto] of Object.entries(modos)) {
      expect(texto.h1, `h1 (${modo})`).toBe(1)
      expect(texto.visivel, `texto de main (${modo})`).toBe(base)
      const visiveis = palavras(texto.porNo)
      const soOcultas = [...palavras(texto.oculto)].filter((palavra) => !visiveis.has(palavra))
      expect(soOcultas, `palavras que só existem em nós aria-hidden (${modo})`).toEqual([])
    }
  })
})

test.describe('X4 movimento reduzido: página estática e completa (1440)', () => {
  test.use({ ...DESKTOP, reducedMotion: 'reduce' })
  test('X4: data-motion="reduzido", todas as section visíveis e o mesmo texto do modo normal e da página sem JavaScript', async ({
    page,
    browser,
    baseURL,
  }) => {
    await page.goto('/')
    await expect(page.locator('[data-motion="reduzido"]').first()).toBeAttached()
    await esperarEntrada(page)
    // Visíveis antes de rolar: nada espera a rolagem para aparecer.
    const visiveis = await page.evaluate(() =>
      Array.from(document.querySelectorAll('section')).map((secao) => {
        const caixa = secao.getBoundingClientRect()
        return (
          secao.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
          caixa.width > 0 &&
          caixa.height > 0
        )
      }),
    )
    expect(visiveis.length, 'section na página').toBeGreaterThanOrEqual(3)
    expect(visiveis.every(Boolean), `section visíveis: ${JSON.stringify(visiveis)}`).toBe(true)
    // E continuam visíveis quando a rolagem chega a cada uma.
    const secoes = page.locator('section')
    for (let i = 0; i < visiveis.length; i++) {
      const secao = secoes.nth(i)
      await secao.scrollIntoViewIfNeeded()
      await expect(secao, `section ${i}`).toBeVisible()
      const visivel = await secao.evaluate((el) =>
        el.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      )
      expect(visivel, `section ${i} sem opacidade 0 nem visibility hidden`).toBe(true)
    }

    const reduzido = await textoDoMain(page)
    for (const [modo, opcoes] of [
      ['normal', { reducedMotion: 'no-preference' }],
      ['sem JavaScript', { javaScriptEnabled: false }],
    ] as const) {
      const contexto = await browser.newContext({ ...DESKTOP, baseURL, ...opcoes })
      try {
        const outra = await contexto.newPage()
        await outra.goto('/')
        if (modo === 'normal') await esperarEntrada(outra)
        expect(reduzido.visivel, `texto de main com movimento reduzido e ${modo}`).toBe(
          (await textoDoMain(outra)).visivel,
        )
      } finally {
        await contexto.close()
      }
    }
  })
})
