// O relatorio.md de um experimento, gerado de experimento.json e resultados.json (evals/README.md, Como ler um
// relatório). A causa provável de cada falha entra por anotacoes.json ({ "<id da tentativa>": "<causa>" }), que é
// escrito depois de ler a transcrição e sobrevive a um relatório gerado de novo.
//
//   node evals/runner/relatorio.ts <pasta do experimento>
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { ResultadoDoAvaliador } from '../avaliadores/contexto.ts'
import { escreverFormatado, lerJson, RAIZ } from './comum.ts'
import type { Experimento, Registro, Resultados } from './registro.ts'

type Anotacoes = Record<string, string>

export type Agregado = {
  caso: string
  tipo: string
  registros: Registro[]
  /** Tentativas que contam na conta de passa e falha. */
  validas: number
  passa: number
  aParte: string[]
  custoMedio: number
  turnosMedios: number | null
}

const CONTAM = new Set(['passa', 'falha', 'indeterminado'])

export function agregar(registros: Registro[]): Agregado[] {
  const porCaso = new Map<string, Registro[]>()
  for (const r of registros) porCaso.set(r.caso, [...(porCaso.get(r.caso) ?? []), r])
  return [...porCaso.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([caso, lista]) => {
      const contam = lista.filter((r) => CONTAM.has(r.status))
      const fora = new Map<string, number>()
      for (const r of lista.filter((r) => !CONTAM.has(r.status) || r.status === 'indeterminado')) {
        fora.set(r.status, (fora.get(r.status) ?? 0) + 1)
      }
      const turnos = lista.map((r) => r.agente?.turnos).filter((t): t is number => typeof t === 'number')
      return {
        caso,
        tipo: lista[0].tipo,
        registros: lista,
        validas: contam.length,
        passa: contam.filter((r) => r.status === 'passa').length,
        aParte: [...fora].map(([status, n]) => `${n} ${status}`),
        custoMedio: lista.reduce((s, r) => s + (r.agente?.custoUsd ?? 0) + r.juiz.custoUsd, 0) / lista.length,
        turnosMedios: turnos.length ? turnos.reduce((a, b) => a + b, 0) / turnos.length : null,
      }
    })
}

const usd = (n: number) => `US$ ${n.toFixed(2)}`
const celula = (texto: string) => texto.replaceAll('|', '\\|').replace(/\s*\n\s*/g, ' ')

function tabela(cabecalho: string[], linhas: string[][]): string {
  return [
    `| ${cabecalho.join(' | ')} |`,
    `| ${cabecalho.map(() => '---').join(' | ')} |`,
    ...linhas.map((l) => `| ${l.map(celula).join(' | ')} |`),
  ].join('\n')
}

function porCaso(agregados: Agregado[], tentativas: number): string {
  return tabela(
    ['Caso', 'Tipo', 'c/n', `pass@${tentativas}`, `pass^${tentativas}`, 'À parte', 'Custo médio', 'Turnos médios'],
    agregados.map((a) => [
      a.caso,
      a.tipo,
      `${a.passa}/${a.validas}`,
      a.passa >= 1 ? 'sim' : 'não',
      a.passa === tentativas && a.validas === tentativas ? 'sim' : 'não',
      a.aParte.join(', ') || '—',
      usd(a.custoMedio),
      a.turnosMedios === null ? '—' : a.turnosMedios.toFixed(1),
    ]),
  )
}

function porAvaliador(agregados: Agregado[]): string {
  const nomes = [...new Set(agregados.flatMap((a) => a.registros.flatMap((r) => Object.keys(r.avaliadores))))]
  return tabela(
    ['Avaliador', ...agregados.map((a) => a.caso)],
    nomes.map((nome) => [
      nome,
      ...agregados.map((a) => {
        const lista = a.registros.map((r) => r.avaliadores[nome]).filter((r): r is ResultadoDoAvaliador => Boolean(r))
        if (!lista.length) return '—'
        if (lista.every((r) => r.status === 'informa')) return 'informa'
        const passa = lista.filter((r) => r.status === 'passa').length
        const outros = lista.filter((r) => r.status === 'indeterminado' || r.status === 'nao-rodou').length
        return `${passa}/${lista.length}${outros ? ` (${outros} sem decisão)` : ''}`
      }),
    ]),
  )
}

function resumo(agregados: Agregado[], tentativas: number): string[] {
  const media = agregados.length
    ? agregados.reduce((s, a) => s + (a.validas ? a.passa / a.validas : 0), 0) / agregados.length
    : 0
  const comTodas = agregados.filter((a) => a.passa === tentativas && a.validas === tentativas).length
  const registros = agregados.flatMap((a) => a.registros)
  const custo = registros.reduce((s, r) => s + (r.agente?.custoUsd ?? 0) + r.juiz.custoUsd, 0)
  return [
    String(agregados.length),
    media.toFixed(2),
    String(comTodas),
    registros.length ? usd(custo / registros.length) : '—',
    usd(custo),
  ]
}

function detalheDaTentativa(r: Registro, anotacoes: Anotacoes): string {
  const linhas = [`### ${r.id}: ${r.status}${r.confere ? ` (confere: ${r.confere})` : ''}`, '']
  if (r.agente) {
    const a = r.agente
    linhas.push(
      `- Agente: ${a.fim}, ${usd(a.custoUsd)}, ${a.turnos ?? '?'} turnos, ${a.duracaoS} s${a.saiuSozinho ? '' : ', encerrado depois da carência'}. Transcrição: \`${a.transcricao}\``,
    )
    if (a.modelos.principal.length)
      linhas.push(
        `- Modelos: ${a.modelos.principal.join(', ')}${a.modelos.subagentes.length ? `; subagentes: ${a.modelos.subagentes.join(', ')}` : ''}`,
      )
  }
  if (r.juiz.chamadas) linhas.push(`- Juiz: ${r.juiz.chamadas} chamadas, ${usd(r.juiz.custoUsd)}`)
  for (const [nome, resultado] of Object.entries(r.avaliadores)) {
    if (resultado.status === 'passa') continue
    linhas.push(`- ${nome} (${resultado.status}): ${resultado.resumo}`)
  }
  if (r.marcas.length) linhas.push(`- Marcas: ${r.marcas.join('; ')}`)
  if (r.diff) linhas.push(`- Diff: [${r.diff}](${r.diff})`)
  if (anotacoes[r.id]) linhas.push(`- Causa provável: ${anotacoes[r.id]}`)
  return linhas.join('\n')
}

function configuracao(exp: Experimento): string {
  const linhas: string[][] = [
    ['Modo', exp.modo],
    ['Base', `${exp.base.tag} (${exp.base.commit.slice(0, 7)})`],
    ['Claude Code', exp.versoes.claude ?? exp.claude_code],
    [
      'Agente',
      exp.modo === 'sem-modelo'
        ? 'nenhum'
        : `${exp.agente.modelo}, esforço ${exp.agente.esforco ?? 'padrão'}, modo ${exp.agente.modo}`,
    ],
    ['Juiz', exp.juiz ? `${exp.juiz.modelo}, ${exp.juiz.votos} votos` : 'sem juiz'],
    exp.modo === 'sem-modelo'
      ? ['Variantes', exp.variantes.join(', ')]
      : ['Tentativas por caso', String(exp.tentativas)],
    ['Teto por tentativa', usd(exp.teto_tentativa_usd)],
    ['Orçamento da rodada', usd(exp.orcamento_rodada_usd)],
    ['Harness', `harness.patch (sha256 ${exp.harness_patch_sha256.slice(0, 12)})`],
    ['Começo e fim', `${exp.inicio} a ${exp.fim ?? '(em andamento)'}`],
  ]
  if (exp.parada) linhas.push(['Parada', exp.parada])
  return tabela(['Campo', 'Valor'], linhas)
}

function semModelo(exp: Experimento, registros: Registro[]): string {
  const partes = [
    tabela(
      ['Caso', 'Variante', 'Precisa mostrar', 'Confere', 'Status', 'Avaliadores que não passaram'],
      registros.map((r) => [
        r.caso,
        r.variante ?? '',
        r.variante === 'referencia'
          ? 'passa em tudo'
          : r.variante === 'quebrada'
            ? 'reprova no comportamento, e só nele'
            : 'reprova em pedido-cumprido',
        r.confere ?? '',
        r.status,
        Object.entries(r.avaliadores)
          .filter(([, v]) => v.status !== 'passa' && v.status !== 'informa')
          .map(([nome, v]) => `${nome} (${v.status})`)
          .join(', ') || '—',
      ]),
    ),
  ]
  if (exp.conferencias_do_base) {
    partes.push(
      '## Conferências no commit base',
      tabela(
        ['Avaliador', 'Resultado', 'Resumo'],
        Object.entries(exp.conferencias_do_base).map(([nome, c]) => [nome, c.ok ? 'ok' : 'falhou', c.resumo]),
      ),
    )
  }
  return partes.join('\n\n')
}

function lerResultados(dir: string): Registro[] {
  const arquivo = path.join(dir, 'resultados.json')
  return existsSync(arquivo) ? lerJson<Resultados>(arquivo).tentativas : []
}

function lerAnotacoes(dir: string): Anotacoes {
  const arquivo = path.join(dir, 'anotacoes.json')
  return existsSync(arquivo) ? lerJson<Anotacoes>(arquivo) : {}
}

export async function escreverRelatorios(dirExp: string, dirVal: string): Promise<void> {
  const exp = lerJson<Experimento>(path.join(dirExp, 'experimento.json'))
  const ajuste = lerResultados(dirExp)
  const validacao = lerResultados(dirVal)
  const nome = path.basename(dirExp)
  const n = exp.tentativas
  const custoAgente = [...ajuste, ...validacao].reduce((s, r) => s + (r.agente?.custoUsd ?? 0), 0)
  const custoJuiz = [...ajuste, ...validacao].reduce((s, r) => s + r.juiz.custoUsd, 0)
  const custo = tabela(
    ['Agente', 'Juiz', 'Total', 'Orçamento da rodada'],
    [[usd(custoAgente), usd(custoJuiz), usd(custoAgente + custoJuiz), usd(exp.orcamento_rodada_usd)]],
  )
  const concordancia = path.join(dirExp, 'concordancia.md')

  const principal = [`# ${nome}`, '', exp.hipotese, '', '## Configuração', '', configuracao(exp), '']
  if (exp.modo === 'sem-modelo') {
    principal.push('## Ajuste', '', ajuste.length ? semModelo(exp, ajuste) : '(nenhum caso de ajuste)', '')
    if (validacao.length) {
      const confere = validacao.filter((r) => r.confere === 'sim').length
      principal.push(
        '## Validação',
        '',
        `${confere} de ${validacao.length} variantes conferem. O detalhe fica em \`${path.relative(RAIZ, dirVal).replaceAll('\\', '/')}/\`.`,
        '',
      )
    }
  } else {
    const agAjuste = agregar(ajuste)
    const agValidacao = agregar(validacao)
    const anotacoes = lerAnotacoes(dirExp)
    principal.push(
      '## Resumo',
      '',
      tabela(
        ['Conjunto', 'Casos', 'Média de c/n', `Casos com pass^${n}`, 'Custo médio por tentativa', 'Custo do conjunto'],
        [
          ['ajuste', ...resumo(agAjuste, n)],
          ['validação', ...resumo(agValidacao, n)],
        ],
      ),
      '',
      '## Ajuste: por caso',
      '',
      agAjuste.length ? porCaso(agAjuste, n) : '(nenhum)',
      '',
      '## Ajuste: por avaliador',
      '',
      agAjuste.length ? porAvaliador(agAjuste) : '(nenhum)',
      '',
      '## Ajuste: tentativas',
      '',
      ajuste.map((r) => detalheDaTentativa(r, anotacoes)).join('\n\n') || '(nenhuma)',
      '',
    )
    if (agValidacao.length) {
      principal.push(
        '## Validação: por caso',
        '',
        `Só os números: o detalhe fica em \`${path.relative(RAIZ, dirVal).replaceAll('\\', '/')}/\`, que a sessão de ajuste não lê.`,
        '',
        porCaso(agValidacao, n),
        '',
        '## Validação: por avaliador',
        '',
        porAvaliador(agValidacao),
        '',
      )
    }
  }
  principal.push('## Custo', '', custo, '')
  if (existsSync(concordancia))
    principal.push('## Concordância do juiz', '', `Em [concordancia.md](concordancia.md).`, '')
  await escreverFormatado(path.join(dirExp, 'relatorio.md'), principal.join('\n'))

  if (validacao.length) {
    const anotacoes = lerAnotacoes(dirVal)
    const corpo = [
      `# ${nome}: validação`,
      '',
      `O relatório da rodada está em \`${path.relative(RAIZ, dirExp).replaceAll('\\', '/')}/relatorio.md\`.`,
      '',
    ]
    if (exp.modo === 'sem-modelo') {
      corpo.push(semModelo({ ...exp, conferencias_do_base: undefined }, validacao), '')
    } else {
      const ag = agregar(validacao)
      corpo.push(
        '## Por caso',
        '',
        porCaso(ag, n),
        '',
        '## Por avaliador',
        '',
        porAvaliador(ag),
        '',
        '## Tentativas',
        '',
        validacao.map((r) => detalheDaTentativa(r, anotacoes)).join('\n\n'),
        '',
      )
    }
    await escreverFormatado(path.join(dirVal, 'relatorio.md'), corpo.join('\n'))
  }
}

if (import.meta.filename === path.resolve(process.argv[1] ?? '')) {
  const alvo = process.argv[2]
  if (!alvo) {
    console.error('Uso: node evals/runner/relatorio.ts <pasta do experimento>')
    process.exitCode = 1
  } else {
    const dirExp = path.resolve(alvo)
    const dirVal = path.join(RAIZ, 'evals', 'validacao', 'experimentos', path.basename(dirExp))
    await escreverRelatorios(dirExp, dirVal)
    console.log(`relatório: ${path.relative(RAIZ, path.join(dirExp, 'relatorio.md'))}`)
  }
}
