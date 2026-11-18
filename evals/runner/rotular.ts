// Calibragem do juiz: exporta os itens julgados, sem o veredito do juiz, para o Lucas rotular, e mede a concordância
// nos dois sentidos (evals/README.md, Juiz).
//
//   node evals/runner/rotular.ts exportar <experimento> [--quebradas <experimento sem modelo>]
//       Escreve rotulos.md na pasta do experimento (itens do ajuste) e na da validação (itens da validação), em ordem
//       embaralhada e sem o veredito. Cada item termina em "**Rótulo:** ?": troque o ? por PASS ou FAIL.
//   node evals/runner/rotular.ts medir <experimento>
//       Lê os rótulos, compara com o veredito do juiz e escreve concordancia.md nas duas pastas: a tabela, por rubrica
//       e no geral, vai para a do experimento; as divergências de cada conjunto ficam na pasta dele.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { escreverFormatado, lerArgumentos, sha256 } from './comum.ts'
import type { ItemJulgado } from './juiz.ts'
import { lerRegistros, pastasDoExperimento, type Registro } from './registro.ts'
import { escreverRelatorios } from './relatorio.ts'

type ItemParaRotular = { chave: string; conjunto: 'ajuste' | 'validacao'; registro: Registro; item: ItemJulgado }

const PERGUNTA: Record<string, string> = {
  'juiz-comentario-descreve': 'Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?',
  'juiz-comentario-porque': 'O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?',
  'juiz-comentario-antigo': 'O comentário, que a tentativa não mudou, continua verdadeiro para o trecho de depois?',
  'comentarios-narracao': 'O comentário fala do código (PASS) ou narra a tarefa, a conversa ou o histórico (FAIL)?',
  'pedido-cumprido': 'O diff cumpre o critério do caso?',
}

/** Os itens julgados de uma lista de registros, com uma chave que não muda entre exportar e medir. */
function itensJulgados(registros: Registro[]): ItemParaRotular[] {
  return registros.flatMap((registro) =>
    Object.values(registro.avaliadores).flatMap((resultado) =>
      (resultado.itens ?? []).map((item) => ({
        chave: `${registro.id}/${item.rubrica}/${item.id}`,
        conjunto: registro.conjunto,
        registro,
        item,
      })),
    ),
  )
}

/** Ordem embaralhada e estável: o hash da chave decide, para o rótulo não seguir a ordem das tentativas. */
function embaralhar(itens: ItemParaRotular[]): ItemParaRotular[] {
  return [...itens].sort((a, b) => sha256(a.chave).localeCompare(sha256(b.chave)))
}

function arquivoDeRotulos(itens: ItemParaRotular[], fontes: string[]): string {
  const partes = [
    '# Rótulos do juiz',
    '',
    `<!-- fontes: ${fontes.join(', ')} -->`,
    '',
    'Para cada item, leia a rubrica em `evals/rubricas/<rubrica>.md` e troque o `?` de **Rótulo** por `PASS` ou `FAIL`. O veredito do juiz não aparece aqui de propósito.',
    '',
  ]
  itens.forEach(({ chave, item }, i) => {
    partes.push(
      `<!-- item: ${chave} -->`,
      '',
      `## ${i + 1}. ${item.rubrica}`,
      '',
      `${PERGUNTA[item.rubrica] ?? ''}`,
      '',
      '````text',
      item.conteudo,
      '````',
      '',
      '**Rótulo:** ?',
      '',
    )
  })
  return partes.join('\n')
}

async function exportar(experimento: string, quebradas: string | null): Promise<void> {
  const { dirExp, dirVal } = pastasDoExperimento(experimento)
  const fontes = [path.basename(dirExp)]
  let itens = itensJulgados(lerRegistros(dirExp, dirVal).filter((r) => r.n !== null))
  if (quebradas) {
    const pq = pastasDoExperimento(quebradas)
    fontes.push(path.basename(pq.dirExp))
    itens = [...itens, ...itensJulgados(lerRegistros(pq.dirExp, pq.dirVal).filter((r) => r.variante === 'quebrada'))]
  }
  for (const [conjunto, dir] of [
    ['ajuste', dirExp],
    ['validacao', dirVal],
  ] as const) {
    const doConjunto = embaralhar(itens.filter((i) => i.conjunto === conjunto))
    if (!doConjunto.length) continue
    const arquivo = path.join(dir, 'rotulos.md')
    if (existsSync(arquivo) && /\*\*Rótulo:\*\* (PASS|FAIL)/.test(readFileSync(arquivo, 'utf8'))) {
      console.error(`${arquivo} já tem rótulos; não sobrescrevo.`)
      continue
    }
    await escreverFormatado(arquivo, arquivoDeRotulos(doConjunto, fontes))
    console.log(`${doConjunto.length} itens em ${arquivo}`)
  }
}

type Rotulado = ItemParaRotular & { rotulo: 'PASS' | 'FAIL' }

function lerRotulos(arquivo: string): { fontes: string[]; rotulos: Map<string, string> } {
  const texto = existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : ''
  const fontes = (texto.match(/<!-- fontes: (.*?) -->/)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const rotulos = new Map<string, string>()
  for (const m of texto.matchAll(/<!-- item: (\S+) -->[\s\S]*?\*\*Rótulo:\*\*\s*(\S+)/g))
    rotulos.set(m[1], m[2].toUpperCase())
  return { fontes, rotulos }
}

function tabela(cabecalho: string[], linhas: string[][]): string {
  return [
    `| ${cabecalho.join(' | ')} |`,
    `| ${cabecalho.map(() => '---').join(' | ')} |`,
    ...linhas.map((l) => `| ${l.join(' | ')} |`),
  ].join('\n')
}

function linha(nome: string, lista: Rotulado[]): string[] {
  const iguais = lista.filter((r) => r.item.veredito === r.rotulo).length
  const passa = lista.filter((r) => r.rotulo === 'PASS')
  const falha = lista.filter((r) => r.rotulo === 'FAIL')
  const fracao = (a: number, b: number) => (b ? `${a}/${b} (${Math.round((100 * a) / b)} %)` : '—')
  return [
    nome,
    String(lista.length),
    fracao(iguais, lista.length),
    fracao(passa.filter((r) => r.item.veredito === 'PASS').length, passa.length),
    fracao(falha.filter((r) => r.item.veredito === 'FAIL').length, falha.length),
    String(lista.filter((r) => r.item.veredito === 'UNKNOWN').length),
  ]
}

async function medir(experimento: string): Promise<void> {
  const { dirExp, dirVal } = pastasDoExperimento(experimento)
  const rotulados: Rotulado[] = []
  const semRotulo: string[] = []
  for (const dir of [dirExp, dirVal]) {
    const { fontes, rotulos } = lerRotulos(path.join(dir, 'rotulos.md'))
    if (!rotulos.size) continue
    const registros = fontes.flatMap((fonte) => {
      const p = pastasDoExperimento(fonte)
      return lerRegistros(p.dirExp, p.dirVal)
    })
    const porChave = new Map(itensJulgados(registros).map((i) => [i.chave, i]))
    for (const [chave, rotulo] of rotulos) {
      const item = porChave.get(chave)
      if (!item) continue
      if (rotulo === 'PASS' || rotulo === 'FAIL') rotulados.push({ ...item, rotulo })
      else semRotulo.push(chave)
    }
  }
  if (!rotulados.length) {
    console.error('Nenhum item rotulado ainda: troque o ? de **Rótulo** por PASS ou FAIL em rotulos.md.')
    process.exitCode = 1
    return
  }
  const rubricas = [...new Set(rotulados.map((r) => r.item.rubrica))].sort()
  const cabecalho = [
    'Rubrica',
    'Itens',
    'Concordância',
    'Lucas PASS: juiz PASS',
    'Lucas FAIL: juiz FAIL',
    'Juiz UNKNOWN',
  ]
  const matriz = (['PASS', 'FAIL'] as const).map((rotulo) => [
    `Lucas ${rotulo}`,
    ...(['PASS', 'FAIL', 'UNKNOWN'] as const).map((v) =>
      String(rotulados.filter((r) => r.rotulo === rotulo && r.item.veredito === v).length),
    ),
  ])
  const corpo = [
    `# Concordância do juiz: ${path.basename(dirExp)}`,
    '',
    `${rotulados.length} itens rotulados${semRotulo.length ? `, ${semRotulo.length} ainda sem rótulo` : ''}. UNKNOWN do juiz conta como discordância. O limiar para confiar no juiz é do Lucas.`,
    '',
    tabela(cabecalho, [
      ...rubricas.map((r) =>
        linha(
          r,
          rotulados.filter((x) => x.item.rubrica === r),
        ),
      ),
      linha('todas', rotulados),
    ]),
    '',
    '## Matriz',
    '',
    tabela(['', 'Juiz PASS', 'Juiz FAIL', 'Juiz UNKNOWN'], matriz),
    '',
  ]
  const divergencias = (conjunto: 'ajuste' | 'validacao') =>
    rotulados
      .filter((r) => r.conjunto === conjunto && r.item.veredito !== r.rotulo)
      .map(
        (r) =>
          `- \`${r.chave}\`: Lucas ${r.rotulo}, juiz ${r.item.veredito} (${r.item.votos.map((v) => v.veredito).join(', ')}): ${r.item.justificativa}`,
      )
  const ajuste = divergencias('ajuste')
  corpo.push('## Divergências no ajuste', '', ajuste.length ? ajuste.join('\n') : 'Nenhuma.', '')
  const validacao = divergencias('validacao')
  if (rotulados.some((r) => r.conjunto === 'validacao')) {
    corpo.push(
      `As divergências da validação estão em \`evals/validacao/experimentos/${path.basename(dirVal)}/concordancia.md\`.`,
      '',
    )
    await escreverFormatado(
      path.join(dirVal, 'concordancia.md'),
      [
        `# Divergências na validação: ${path.basename(dirVal)}`,
        '',
        validacao.length ? validacao.join('\n') : 'Nenhuma.',
        '',
      ].join('\n'),
    )
  }
  await escreverFormatado(path.join(dirExp, 'concordancia.md'), corpo.join('\n'))
  await escreverRelatorios(dirExp, dirVal)
  console.log(corpo.join('\n'))
}

const { opcoes, posicionais } = lerArgumentos(process.argv.slice(2))
const [comando, experimento] = posicionais
if (comando === 'exportar' && experimento) {
  const quebradas = opcoes.get('quebradas')
  await exportar(experimento, typeof quebradas === 'string' ? quebradas : null)
} else if (comando === 'medir' && experimento) {
  await medir(experimento)
} else {
  console.error(
    'Uso: node evals/runner/rotular.ts exportar <experimento> [--quebradas <sem modelo>] | medir <experimento>',
  )
  process.exitCode = 1
}
