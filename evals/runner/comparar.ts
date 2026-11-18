// Compara um experimento com o harness em uso, caso a caso (evals/README.md, Como ler um relatório).
//
//   node evals/runner/comparar.ts <harness em uso> <candidato> [--saida <arquivo.md>]
//
// O primeiro é sempre a linha de base ou o último experimento adotado, nunca o último experimento rodado. Para cada
// caso, a probabilidade de o candidato ser melhor vem de Beta(c+1, n−c+1) em cada braço: 3/3 contra 1/3 dá 0,93;
// 3/3 contra 2/3, 0,79; 2/3 contra 1/3, 0,76. Uma tentativa de diferença em três não decide nada sozinha.
import path from 'node:path'
import { escreverFormatado, lerArgumentos, lerJson } from './comum.ts'
import { lerRegistros, pastasDoExperimento, type Experimento, type Registro } from './registro.ts'
import { agregar, type Agregado } from './relatorio.ts'

/** Densidade de Beta(a, b) com a e b inteiros, em x. */
function densidade(a: number, b: number, x: number): number {
  let logBeta = 0
  for (let i = 1; i < a; i++) logBeta -= Math.log(i)
  for (let i = 1; i < b; i++) logBeta -= Math.log(i)
  for (let i = 1; i < a + b; i++) logBeta += Math.log(i)
  return Math.exp(logBeta + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x))
}

/** P(p_B > p_A), com p ~ Beta(c+1, n−c+1) em cada braço, por integração numérica. */
export function probabilidadeDeMelhora(cA: number, nA: number, cB: number, nB: number): number {
  const passos = 20_000
  let acumuladaA = 0
  let p = 0
  for (let i = 0; i < passos; i++) {
    const x = (i + 0.5) / passos
    const fa = densidade(cA + 1, nA - cA + 1, x) / passos
    const fb = densidade(cB + 1, nB - cB + 1, x) / passos
    // B em x supera A em tudo o que ficou abaixo de x, e empata na metade da faixa de x.
    p += fb * (acumuladaA + fa / 2)
    acumuladaA += fa
  }
  return p
}

function marca(a: Agregado | undefined, b: Agregado | undefined): string {
  if (!a || !b || !a.validas || !b.validas) return 'sem dado'
  const ta = a.passa / a.validas
  const tb = b.passa / b.validas
  return tb > ta ? 'melhora' : tb < ta ? 'regressão' : 'igual'
}

function linhasDosCasos(regA: Registro[], regB: Registro[]): string[][] {
  const aggA = new Map(agregar(regA).map((g) => [g.caso, g]))
  const aggB = new Map(agregar(regB).map((g) => [g.caso, g]))
  const casos = [...new Set([...aggA.keys(), ...aggB.keys()])].sort()
  return casos.map((caso) => {
    const a = aggA.get(caso)
    const b = aggB.get(caso)
    const prob =
      a && b && a.validas && b.validas ? probabilidadeDeMelhora(a.passa, a.validas, b.passa, b.validas) : null
    return [
      caso,
      a ? `${a.passa}/${a.validas}` : '—',
      b ? `${b.passa}/${b.validas}` : '—',
      marca(a, b),
      prob === null ? '—' : prob.toFixed(2),
      a ? `US$ ${a.custoMedio.toFixed(2)}` : '—',
      b ? `US$ ${b.custoMedio.toFixed(2)}` : '—',
      a?.turnosMedios?.toFixed(1) ?? '—',
      b?.turnosMedios?.toFixed(1) ?? '—',
    ]
  })
}

function linhasDosAvaliadores(regA: Registro[], regB: Registro[]): string[][] {
  const nomes = [...new Set([...regA, ...regB].flatMap((r) => Object.keys(r.avaliadores)))].sort()
  const contar = (lista: Registro[], caso: string, nome: string) => {
    const resultados = lista
      .filter((r) => r.caso === caso)
      .map((r) => r.avaliadores[nome])
      .filter(Boolean)
    return resultados.length ? `${resultados.filter((r) => r.status === 'passa').length}/${resultados.length}` : '—'
  }
  const casos = [...new Set([...regA, ...regB].map((r) => r.caso))].sort()
  return casos.flatMap((caso) => nomes.map((nome) => [caso, nome, contar(regA, caso, nome), contar(regB, caso, nome)]))
}

function tabela(cabecalho: string[], linhas: string[][]): string {
  return [
    `| ${cabecalho.join(' | ')} |`,
    `| ${cabecalho.map(() => '---').join(' | ')} |`,
    ...linhas.map((l) => `| ${l.join(' | ')} |`),
  ].join('\n')
}

export function comparar(nomeA: string, nomeB: string): string {
  const pa = pastasDoExperimento(nomeA)
  const pb = pastasDoExperimento(nomeB)
  const expA = lerJson<Experimento>(path.join(pa.dirExp, 'experimento.json'))
  const expB = lerJson<Experimento>(path.join(pb.dirExp, 'experimento.json'))
  const regA = lerRegistros(pa.dirExp, pa.dirVal).filter((r) => r.n !== null)
  const regB = lerRegistros(pb.dirExp, pb.dirVal).filter((r) => r.n !== null)
  const avisos: string[] = []
  for (const [campo, va, vb] of [
    ['Claude Code', expA.versoes.claude ?? expA.claude_code, expB.versoes.claude ?? expB.claude_code],
    ['modelo do agente', expA.agente.modelo, expB.agente.modelo],
    ['esforço', String(expA.agente.esforco), String(expB.agente.esforco)],
    ['juiz', expA.juiz?.modelo ?? 'sem juiz', expB.juiz?.modelo ?? 'sem juiz'],
    ['commit base', expA.base.commit, expB.base.commit],
  ] as const) {
    if (va !== vb)
      avisos.push(`${campo} difere: ${va} em ${path.basename(pa.dirExp)}, ${vb} em ${path.basename(pb.dirExp)}`)
  }
  const cabecalho = [
    'Caso',
    'Em uso c/n',
    'Candidato c/n',
    'Marca',
    'P(candidato melhor)',
    'Custo em uso',
    'Custo candidato',
    'Turnos em uso',
    'Turnos candidato',
  ]
  const partes = [
    `# ${path.basename(pb.dirExp)} contra ${path.basename(pa.dirExp)}`,
    avisos.length
      ? avisos.map((a) => `- Atenção: ${a}`).join('\n')
      : 'Mesma versão do Claude Code, mesmo modelo e mesmo base.',
    '## Ajuste',
    tabela(
      cabecalho,
      linhasDosCasos(
        regA.filter((r) => r.conjunto === 'ajuste'),
        regB.filter((r) => r.conjunto === 'ajuste'),
      ),
    ),
    '## Validação',
    tabela(
      cabecalho,
      linhasDosCasos(
        regA.filter((r) => r.conjunto === 'validacao'),
        regB.filter((r) => r.conjunto === 'validacao'),
      ),
    ),
    '## Ajuste: por avaliador',
    tabela(
      ['Caso', 'Avaliador', 'Em uso', 'Candidato'],
      linhasDosAvaliadores(
        regA.filter((r) => r.conjunto === 'ajuste'),
        regB.filter((r) => r.conjunto === 'ajuste'),
      ),
    ),
  ]
  return `${partes.join('\n\n')}\n`
}

if (import.meta.filename === path.resolve(process.argv[1] ?? '')) {
  const { opcoes, posicionais } = lerArgumentos(process.argv.slice(2))
  if (posicionais.length !== 2) {
    console.error('Uso: node evals/runner/comparar.ts <harness em uso> <candidato> [--saida <arquivo.md>]')
    process.exitCode = 1
  } else {
    const texto = comparar(posicionais[0], posicionais[1])
    const saida = opcoes.get('saida')
    if (typeof saida === 'string') await escreverFormatado(path.resolve(saida), texto)
    else console.log(texto)
  }
}
