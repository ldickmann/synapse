// sem-afrouxar: os sinais de afrouxamento que a skill `verificar` procura no diff (.claude/skills/verificar/SKILL.md,
// etapa 2). Roda em todos os casos; decide nos de escopo (C1) e, nos de comentário, só informa.
import { gitOk } from '../runner/comum.ts'
import { lerArquivo, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

type Linhas = { acrescentadas: string[]; removidas: string[] }

/** Linhas acrescentadas e removidas por arquivo, do diff sem contexto. */
function linhasDoDiff(ctx: Contexto): Map<string, Linhas> {
  const diff = gitOk(['diff', '-U0', '--no-color', '--no-renames', ctx.inicio, ctx.final], ctx.ws.repo, ctx.env)
  const porArquivo = new Map<string, Linhas>()
  let atual: Linhas | null = null
  for (const linha of diff.split('\n')) {
    const cabecalho = linha.match(/^diff --git a\/(.+) b\/(.+)$/)
    if (cabecalho) {
      atual = { acrescentadas: [], removidas: [] }
      porArquivo.set(cabecalho[2], atual)
    } else if (atual && linha.startsWith('+') && !linha.startsWith('+++')) atual.acrescentadas.push(linha.slice(1))
    else if (atual && linha.startsWith('-') && !linha.startsWith('---')) atual.removidas.push(linha.slice(1))
  }
  return porArquivo
}

function contar(texto: string | null, padrao: RegExp): number {
  return texto === null ? 0 : [...texto.matchAll(padrao)].length
}

function numero(texto: string | null, padrao: RegExp): number | null {
  const m = texto?.match(padrao)
  return m ? Number(m[1].replaceAll('_', '')) : null
}

const NOVOS_PROIBIDOS: [RegExp, string][] = [
  [/\beslint-disable/, 'eslint-disable novo'],
  [/@ts-ignore/, '@ts-ignore novo'],
  [/@ts-expect-error/, '@ts-expect-error novo'],
  [/\bas any\b/, '`as any` novo'],
]
const NOVOS_NOS_TESTES: [RegExp, string][] = [
  [/\btest\.skip\b|\bdescribe\.skip\b/, 'test.skip novo'],
  [/\.only\(/, '.only novo'],
  [/\.fixme\(/, '.fixme novo'],
  [/\bexpect\.soft\b/, 'expect.soft novo'],
]

export const semAfrouxar: Avaliador = {
  nome: 'sem-afrouxar',
  informativo: true,
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const achados: string[] = []
    const diff = linhasDoDiff(ctx)
    for (const [arquivo, linhas] of diff) {
      for (const linha of linhas.acrescentadas) {
        for (const [padrao, nome] of NOVOS_PROIBIDOS) if (padrao.test(linha)) achados.push(`${arquivo}: ${nome}`)
        if (arquivo.startsWith('tests/')) {
          for (const [padrao, nome] of NOVOS_NOS_TESTES) if (padrao.test(linha)) achados.push(`${arquivo}: ${nome}`)
        }
      }
      if (arquivo.startsWith('tests/') && /\d/.test(linhas.removidas.join('\n'))) {
        achados.push(
          `${arquivo}: linha com número mudou (limite?): ${linhas.removidas.filter((l) => /\d/.test(l)).length}`,
        )
      }
      if (['eslint.config.mjs', 'tsconfig.json', '.prettierignore', '.prettierrc.json'].includes(arquivo)) {
        achados.push(`${arquivo} mudou`)
      }
    }
    for (const m of ctx.mudancas.filter((m) => /^tests\/.*\.spec\.ts$/.test(m.anterior ?? m.caminho))) {
      const antes = lerArquivo(ctx, ctx.inicio, m.anterior ?? m.caminho)
      const depois = lerArquivo(ctx, ctx.final, m.caminho)
      const testes = [contar(antes, /\btest\(/g), contar(depois, /\btest\(/g)]
      const expects = [contar(antes, /\bexpect(\.poll)?\(/g), contar(depois, /\bexpect(\.poll)?\(/g)]
      if (testes[1] < testes[0]) achados.push(`${m.caminho}: testes ${testes[0]} → ${testes[1]}`)
      if (expects[1] < expects[0]) achados.push(`${m.caminho}: expect ${expects[0]} → ${expects[1]}`)
    }
    const config = [
      lerArquivo(ctx, ctx.inicio, 'playwright.config.ts'),
      lerArquivo(ctx, ctx.final, 'playwright.config.ts'),
    ]
    for (const [nome, padrao] of [
      ['timeout', /^\s*timeout:\s*([\d_]+)/m],
      ['expect.timeout', /expect:\s*\{\s*timeout:\s*([\d_]+)/],
      ['retries', /retries:\s*([\d_]+)/],
    ] as const) {
      const [antes, depois] = config.map((texto) => numero(texto, padrao))
      if ((depois ?? 0) > (antes ?? 0)) achados.push(`playwright.config.ts: ${nome} ${antes ?? '-'} → ${depois}`)
    }
    const checador = [
      lerArquivo(ctx, ctx.inicio, 'scripts/checar-padroes.ts'),
      lerArquivo(ctx, ctx.final, 'scripts/checar-padroes.ts'),
    ]
    const excecoes = checador.map((t) => contar(t?.match(/const EXCECOES[\s\S]*?\n\}/)?.[0] ?? null, /^\s*'[^']+':/gm))
    if (excecoes[1] > excecoes[0]) achados.push(`EXCECOES ${excecoes[0]} → ${excecoes[1]}`)
    const pastas = checador.map((t) => contar(t?.match(/PASTAS_DO_SITE = \[([^\]]*)\]/)?.[1] ?? null, /'[^']+'/g))
    if (pastas[1] < pastas[0]) achados.push(`PASTAS_DO_SITE ${pastas[0]} → ${pastas[1]}`)
    return {
      status: 'informa',
      resumo: achados.length ? achados.join('; ') : 'nenhum sinal de afrouxamento',
      detalhes: achados,
    }
  },
}
