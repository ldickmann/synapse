// G8, G11 e G23 (SPEC §6 passo 3 e §8.1): Lighthouse mobile em `/`, contra `pnpm build && pnpm start`.
// Uso: node scripts/lighthouse.mjs   (env opcional: PORTA=3000)
// Relatórios em verificacao/lighthouse.report.{json,html}; sai com 1 se algum limite falhar.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(import.meta.dirname, '..')
const BASE = `http://localhost:${process.env.PORTA ?? 3000}`
// O binário JS do pacote, rodado pelo próprio Node (evita o lighthouse.cmd no Windows).
const CLI = path.join(RAIZ, 'node_modules', 'lighthouse', 'cli', 'index.js')
const LIMITES = { performance: 80, accessibility: 95, 'best-practices': 90, seo: 90, lcpMs: 2500, tbtMs: 300, cls: 0.1 }
const CATEGORIAS = [
  ['performance', 'Performance'],
  ['accessibility', 'Acessibilidade'],
  ['best-practices', 'Boas práticas'],
  ['seo', 'SEO'],
]

if (!existsSync(CLI)) {
  console.error(`Lighthouse não encontrado em ${CLI}. Rode pnpm install.`)
  process.exit(1)
}
try {
  await fetch(`${BASE}/`)
} catch {
  console.error(`Servidor não respondeu em ${BASE}. Rode antes: pnpm build && pnpm start`)
  process.exit(1)
}
mkdirSync(path.join(RAIZ, 'verificacao'), { recursive: true })

/** Primeiro nó (`type: 'node'`) dentro dos detalhes de uma auditoria. */
function acharNo(valor) {
  if (!valor || typeof valor !== 'object') return null
  if (valor.type === 'node') return valor
  for (const filho of Array.isArray(valor) ? valor : Object.values(valor)) {
    const no = acharNo(filho)
    if (no) return no
  }
  return null
}

/** O elemento de LCP é o <h1> ou um elemento dentro dele. */
function ehH1(no) {
  if (!no) return false
  if (/^<h1[\s>/]/i.test(no.snippet ?? '')) return true
  return /(^|[\s>])h1(?=$|[.#:[\s>])/i.test(no.selector ?? '')
}

function tabela(linhas) {
  const larguras = linhas[0].map((_, coluna) => Math.max(...linhas.map((linha) => String(linha[coluna]).length)))
  return linhas
    .map((linha, i) => {
      const texto = linha.map((celula, coluna) => String(celula).padEnd(larguras[coluna])).join('  ')
      return i === 0 ? `${texto}\n${larguras.map((l) => '-'.repeat(l)).join('  ')}` : texto
    })
    .join('\n')
}

/** Roda o Lighthouse em `/` e lê do relatório as notas, as medidas e o que falhou. */
function medir() {
  // Exatamente o comando do SPEC §6, passo 3 (com a base em PORTA).
  const argumentos = [
    `${BASE}/`,
    '--form-factor=mobile',
    '--screenEmulation.mobile',
    '--throttling-method=simulate',
    '--throttling.cpuSlowdownMultiplier=4',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    '--output=html',
    '--output-path=verificacao/lighthouse',
    '--chrome-flags=--headless',
  ]
  console.log(`\n> lighthouse ${argumentos.join(' ')}`)
  const inicio = Date.now()
  const execucao = spawnSync(process.execPath, [CLI, ...argumentos], { cwd: RAIZ, stdio: 'inherit' })
  const arquivo = path.join(RAIZ, 'verificacao', 'lighthouse.report.json')
  const resultado = { notas: {}, lcp: null, tbt: null, cls: null, contraste: '-', elementoLcp: '-', falhas: [] }
  if (!existsSync(arquivo) || statSync(arquivo).mtimeMs < inicio - 1000) {
    resultado.falhas.push(`relatório não gerado (lighthouse saiu com ${execucao.status ?? execucao.error?.message})`)
    return resultado
  }
  if (execucao.status !== 0) {
    // No Windows o Chrome às vezes falha ao apagar a pasta temporária depois de gravar o relatório.
    console.warn(`Aviso: lighthouse saiu com ${execucao.status}; usando o relatório gravado agora.`)
  }
  const relatorio = JSON.parse(readFileSync(arquivo, 'utf8'))
  if (relatorio.runtimeError) resultado.falhas.push(`erro do Lighthouse: ${relatorio.runtimeError.message}`)
  for (const [id, nome] of CATEGORIAS) {
    const pontuacao = relatorio.categories?.[id]?.score
    const nota = typeof pontuacao === 'number' ? Math.round(pontuacao * 100) : null
    resultado.notas[id] = nota
    if (nota === null || nota < LIMITES[id]) resultado.falhas.push(`${nome} ${nota ?? 'sem nota'} < ${LIMITES[id]}`)
  }
  const auditoria = (id) => relatorio.audits?.[id]
  resultado.lcp = auditoria('largest-contentful-paint')?.numericValue ?? null
  resultado.tbt = auditoria('total-blocking-time')?.numericValue ?? null
  resultado.cls = auditoria('cumulative-layout-shift')?.numericValue ?? null
  if (resultado.lcp === null || resultado.lcp > LIMITES.lcpMs)
    resultado.falhas.push(`LCP ${resultado.lcp ?? '?'} ms > ${LIMITES.lcpMs} ms`)
  if (resultado.tbt === null || resultado.tbt > LIMITES.tbtMs)
    resultado.falhas.push(`TBT ${resultado.tbt ?? '?'} ms > ${LIMITES.tbtMs} ms`)
  if (resultado.cls === null || resultado.cls > LIMITES.cls)
    resultado.falhas.push(`CLS ${resultado.cls ?? '?'} > ${LIMITES.cls}`)

  const contraste = auditoria('color-contrast')
  if (!contraste) {
    resultado.contraste = 'ausente'
    resultado.falhas.push('auditoria color-contrast ausente')
  } else if (contraste.scoreDisplayMode === 'notApplicable') {
    resultado.contraste = 'n/a'
  } else if (contraste.score === 1) {
    resultado.contraste = 'ok'
  } else {
    const itens = contraste.details?.items?.length ?? 0
    resultado.contraste = `falha (${itens})`
    resultado.falhas.push(`color-contrast com ${itens} elemento(s) abaixo do contraste mínimo`)
  }

  // O Lighthouse 13 trocou a auditoria largest-contentful-paint-element pela lcp-breakdown-insight
  // (o nó do elemento de LCP fica nos detalhes dela); a antiga é lida se existir.
  const no =
    acharNo(auditoria('largest-contentful-paint-element')?.details) ??
    acharNo(auditoria('lcp-breakdown-insight')?.details)
  resultado.elementoLcp = no ? (no.snippet ?? no.selector ?? '?').slice(0, 60) : 'ausente'
  if (!ehH1(no))
    resultado.falhas.push(`elemento de LCP não é o <h1>: ${no ? `${no.selector} ${no.snippet}` : 'ausente'}`)
  return resultado
}

const resultado = medir()
const ms = (valor) => (valor === null ? '-' : `${Math.round(valor)} ms`)
console.log(
  `\n${tabela([
    ['Perf', 'A11y', 'Boas pr.', 'SEO', 'LCP', 'TBT', 'CLS', 'Contraste', 'Elemento de LCP', 'Resultado'],
    [
      resultado.notas.performance ?? '-',
      resultado.notas.accessibility ?? '-',
      resultado.notas['best-practices'] ?? '-',
      resultado.notas.seo ?? '-',
      ms(resultado.lcp),
      ms(resultado.tbt),
      resultado.cls === null ? '-' : resultado.cls.toFixed(3),
      resultado.contraste,
      resultado.elementoLcp,
      resultado.falhas.length === 0 ? 'aprovado' : 'FALHOU',
    ],
  ])}`,
)
if (resultado.falhas.length > 0) {
  console.log('\nFalhas:')
  for (const falha of resultado.falhas) console.log(`  - ${falha}`)
  process.exitCode = 1
}
