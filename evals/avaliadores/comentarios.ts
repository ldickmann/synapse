// Base dos avaliadores de comentário (evals/README.md, O trecho de um comentário e O que vai aos juízes): acha os
// comentários de um arquivo (TypeScript pelo compilador, CSS pelo PostCSS), o trecho de cada um e, pelo diff da
// tentativa, a classe de cada comentário: acrescentado, alterado, movido ou mantido.
import path from 'node:path'
import postcss from 'postcss'
import ts from 'typescript'
import { colapsarEspacos, git, gitOk } from '../runner/comum.ts'
import { lerArquivo, type Contexto } from './contexto.ts'

export type TipoDeComentario = 'linha' | 'fim-de-linha' | 'jsx' | 'cabecalho'

/** Faixa de linhas, contadas de 1, com as duas pontas incluídas. */
export type Faixa = { inicio: number; fim: number }

export type Comentario = {
  inicio: number
  fim: number
  /** O comentário como está no arquivo, com as marcas. */
  bruto: string
  /** O texto sem `//`, `/*`, `*` e `*\/`, com as linhas de um bloco juntas por quebra de linha. */
  texto: string
  tipo: TipoDeComentario
  diretiva: boolean
  /** O código que o comentário acompanha; o arquivo inteiro no cabeçalho; null se não há código depois dele. */
  trecho: Faixa | null
}

const EXT_TS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'])

export function temComentarios(arquivo: string): boolean {
  const ext = path.extname(arquivo).toLowerCase()
  return EXT_TS.has(ext) || ext === '.css'
}

const DIRETIVA = /^(?:eslint[-\s]|@ts-|prettier-ignore|<reference\b|stylelint-)/

/** O texto de um comentário sem as marcas, linha a linha. */
function semMarcas(bruto: string): string {
  if (bruto.startsWith('//')) {
    return bruto
      .split('\n')
      .map((l) => l.trim().replace(/^\/\/\/?\s?/, ''))
      .join('\n')
      .trim()
  }
  return bruto
    .replace(/^\/\*+/, '')
    .replace(/\*+\/$/, '')
    .split('\n')
    .map((l) => l.trim().replace(/^\*\s?/, ''))
    .join('\n')
    .trim()
}

function tipoDeScript(arquivo: string): ts.ScriptKind {
  const ext = path.extname(arquivo).toLowerCase()
  if (ext === '.tsx') return ts.ScriptKind.TSX
  if (ext === '.jsx') return ts.ScriptKind.JSX
  if (ext === '.ts' || ext === '.mts' || ext === '.cts') return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}

function ehJsDoc(no: ts.Node): boolean {
  return no.kind >= ts.SyntaxKind.FirstJSDocNode && no.kind <= ts.SyntaxKind.LastJSDocNode
}

function ehTextoJsx(no: ts.Node): boolean {
  return no.kind === ts.SyntaxKind.JsxText || no.kind === ts.SyntaxKind.JsxTextAllWhiteSpaces
}

/** As folhas da árvore (os tokens), em ordem. O JSDoc fica de fora: o texto dele não é código. */
function folhas(sf: ts.SourceFile): ts.Node[] {
  const lista: ts.Node[] = []
  const visitar = (no: ts.Node): void => {
    if (ehJsDoc(no)) return
    const filhos = no.getChildren(sf)
    if (filhos.length === 0) lista.push(no)
    else for (const filho of filhos) visitar(filho)
  }
  visitar(sf)
  return lista
}

const CONTEINERES = new Set([
  ts.SyntaxKind.SourceFile,
  ts.SyntaxKind.Block,
  ts.SyntaxKind.ModuleBlock,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.DefaultClause,
  ts.SyntaxKind.ObjectLiteralExpression,
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.ClassExpression,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeLiteral,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.ArrayLiteralExpression,
  ts.SyntaxKind.JsxAttributes,
])

/** A lista (instruções de um bloco, propriedades, membros) em que o nó está, ou null. */
function irmaosDe(no: ts.Node): readonly ts.Node[] | null {
  const achado: { lista: readonly ts.Node[] | null } = { lista: null }
  if (!no.parent) return null
  ts.forEachChild(
    no.parent,
    () => undefined,
    (lista) => {
      if (!achado.lista && lista.includes(no)) achado.lista = lista
      return undefined
    },
  )
  return achado.lista
}

const FECHAMENTOS = new Set([
  ts.SyntaxKind.CloseBraceToken,
  ts.SyntaxKind.CloseBracketToken,
  ts.SyntaxKind.CloseParenToken,
  ts.SyntaxKind.EndOfFileToken,
])

type Bruto = { pos: number; end: number; linhaUnica: boolean; folha: ts.Node; antes: boolean }

/** Os comentários de um arquivo TypeScript ou JavaScript, com o tipo e o trecho de cada um. */
function comentariosTs(arquivo: string, fonte: string): Comentario[] {
  const sf = ts.createSourceFile(arquivo, fonte, ts.ScriptTarget.Latest, true, tipoDeScript(arquivo))
  const todas = folhas(sf)
  const linhaDe = (pos: number) => sf.getLineAndCharacterOfPosition(pos).line + 1
  const textosJsx = todas.filter(ehTextoJsx).map((f) => [f.pos, f.end] as const)
  const dentroDeTextoJsx = (pos: number) => textosJsx.some(([a, b]) => pos >= a && pos < b)

  // Cada token traz os comentários de antes (a partir da linha seguinte à do token anterior) e os do fim da linha.
  const vistos = new Map<number, Bruto>()
  for (const folha of todas) {
    if (ehTextoJsx(folha)) continue
    const guardar = (r: ts.CommentRange, antes: boolean) => {
      if (vistos.has(r.pos) || dentroDeTextoJsx(r.pos)) return
      vistos.set(r.pos, {
        pos: r.pos,
        end: r.end,
        linhaUnica: r.kind === ts.SyntaxKind.SingleLineCommentTrivia,
        folha,
        antes,
      })
    }
    for (const r of ts.getLeadingCommentRanges(fonte, folha.pos) ?? []) guardar(r, true)
    for (const r of ts.getTrailingCommentRanges(fonte, folha.end) ?? []) guardar(r, false)
  }
  const ordenados = [...vistos.values()].sort((a, b) => a.pos - b.pos)
  const brutos = ordenados.filter((c) => !ordenados.some((o) => o !== c && o.pos < c.pos && c.end <= o.end))

  // `//` sozinhos em linhas seguidas formam um bloco.
  const sozinho = (c: Bruto) => fonte.slice(fonte.lastIndexOf('\n', c.pos - 1) + 1, c.pos).trim() === ''
  const grupos: Bruto[][] = []
  for (const c of brutos) {
    const ultimo = grupos.at(-1)?.at(-1)
    const juntar =
      ultimo &&
      ultimo.linhaUnica &&
      c.linhaUnica &&
      sozinho(ultimo) &&
      sozinho(c) &&
      linhaDe(c.pos) === linhaDe(ultimo.end) + 1 &&
      fonte.slice(ultimo.end, c.pos).trim() === ''
    if (juntar) grupos.at(-1)!.push(c)
    else grupos.push([c])
  }

  const primeira = sf.statements.find(
    (s) => !ts.isImportDeclaration(s) && !(ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression)),
  )
  const inicioDaPrimeira = primeira ? primeira.getStart(sf) : Number.POSITIVE_INFINITY
  const linhaDaPrimeira = primeira ? linhaDe(inicioDaPrimeira) : Number.POSITIVE_INFINITY
  const totalDeLinhas = fonte.replace(/\n$/, '').split('\n').length
  const linhasSozinhas = grupos.filter((g) => sozinho(g[0])).map((g) => linhaDe(g[0].pos))

  return grupos.map((grupo) => {
    const primeiro = grupo[0]
    const ultimo = grupo[grupo.length - 1]
    const inicio = linhaDe(primeiro.pos)
    const fim = linhaDe(ultimo.end - 1)
    const bruto = fonte.slice(primeiro.pos, ultimo.end)
    const texto = semMarcas(grupo.map((c) => fonte.slice(c.pos, c.end)).join('\n'))
    const pai = primeiro.folha.parent
    let tipo: TipoDeComentario
    let trecho: Faixa | null = null
    if (pai && ts.isJsxExpression(pai) && !pai.expression) {
      tipo = 'jsx'
      const irmaos =
        pai.parent && (ts.isJsxElement(pai.parent) || ts.isJsxFragment(pai.parent)) ? pai.parent.children : null
      const seguinte = irmaos
        ?.slice(irmaos.indexOf(pai) + 1)
        .find((n) => !(ts.isJsxText(n) && n.containsOnlyTriviaWhiteSpaces))
      if (seguinte) trecho = { inicio: linhaDe(seguinte.getStart(sf)), fim: linhaDe(seguinte.end - 1) }
    } else if (!sozinho(primeiro)) {
      // No fim de uma linha: o comentário é daquela instrução (ou propriedade, ou membro).
      tipo = 'fim-de-linha'
      let no: ts.Node = primeiro.folha
      while (no.parent && !CONTEINERES.has(no.parent.kind)) no = no.parent
      trecho = { inicio: linhaDe(no.getStart(sf)), fim: linhaDe(no.end - 1) }
    } else if (ultimo.end <= inicioDaPrimeira && linhaDaPrimeira !== fim + 1) {
      // Antes da primeira declaração que não é import nem diretiva, e sem colar nela: o cabeçalho, do arquivo todo.
      tipo = 'cabecalho'
      trecho = { inicio: 1, fim: totalDeLinhas }
    } else {
      // Sozinho na linha: o nó logo abaixo, inteiro, e as instruções seguintes do mesmo bloco, até a primeira linha
      // em branco, o próximo comentário sozinho na linha ou o fim do bloco. Uma instrução seguinte que tem dentro um
      // comentário sozinho na linha entra só até a linha antes dele: o resto é do outro comentário (em Fundo.tsx, o
      // "Céu" da linha 93 não cobre as estrelas, que têm o comentário da linha 104).
      tipo = 'linha'
      const folha = todas.find((f) => !ehTextoJsx(f) && f.getStart(sf) >= ultimo.end)
      if (folha && !FECHAMENTOS.has(folha.kind)) {
        let no: ts.Node = folha
        while (no.parent && no.parent.kind !== ts.SyntaxKind.SourceFile && no.parent.getStart(sf) === no.getStart(sf)) {
          no = no.parent
        }
        let fimDoTrecho = linhaDe(no.end - 1)
        const irmaos = irmaosDe(no)
        for (const proximo of irmaos ? irmaos.slice(irmaos.indexOf(no) + 1) : []) {
          const inicioDoProximo = linhaDe(proximo.getStart(sf))
          if (inicioDoProximo > fimDoTrecho + 1) break
          const fimDoProximo = linhaDe(proximo.end - 1)
          const dentro = linhasSozinhas.find((l) => l > inicioDoProximo && l <= fimDoProximo)
          if (dentro !== undefined) {
            fimDoTrecho = dentro - 1
            break
          }
          fimDoTrecho = fimDoProximo
        }
        trecho = { inicio: linhaDe(no.getStart(sf)), fim: fimDoTrecho }
      }
    }
    return { inicio, fim, bruto, texto, tipo, diretiva: DIRETIVA.test(texto), trecho }
  })
}

/** Os comentários de um CSS: na linha de uma declaração, são dela; sozinhos na linha, são do nó seguinte. */
function comentariosCss(arquivo: string, fonte: string): Comentario[] {
  let raiz: postcss.Root
  try {
    raiz = postcss.parse(fonte, { from: arquivo })
  } catch {
    return []
  }
  const totalDeLinhas = fonte.replace(/\n$/, '').split('\n').length
  const primeiroNo = raiz.nodes.find((n) => n.type !== 'comment')
  const faixa = (no: postcss.ChildNode | undefined): Faixa | null =>
    no?.source?.start && no.source.end ? { inicio: no.source.start.line, fim: no.source.end.line } : null
  const lista: Comentario[] = []
  raiz.walkComments((c) => {
    const ini = c.source?.start
    const fim = c.source?.end
    if (!ini || !fim) return
    const offset = ini.offset
    const sozinho = fonte.slice(fonte.lastIndexOf('\n', offset - 1) + 1, offset).trim() === ''
    let tipo: TipoDeComentario = 'linha'
    let trecho: Faixa | null
    if (!sozinho) {
      tipo = 'fim-de-linha'
      trecho = faixa(c.prev()) ?? { inicio: ini.line, fim: fim.line }
    } else if (
      c.parent === raiz &&
      primeiroNo?.source?.start &&
      offset < primeiroNo.source.start.offset &&
      primeiroNo.source.start.line !== fim.line + 1
    ) {
      tipo = 'cabecalho'
      trecho = { inicio: 1, fim: totalDeLinhas }
    } else {
      trecho = faixa(c.next())
    }
    lista.push({
      inicio: ini.line,
      fim: fim.line,
      bruto: c.toString(),
      texto: c.text.trim(),
      tipo,
      diretiva: DIRETIVA.test(c.text.trim()),
      trecho,
    })
  })
  return lista
}

export function extrairComentarios(arquivo: string, fonte: string): Comentario[] {
  const normalizado = fonte.replace(/\r\n/g, '\n')
  if (path.extname(arquivo).toLowerCase() === '.css') return comentariosCss(arquivo, normalizado)
  if (EXT_TS.has(path.extname(arquivo).toLowerCase())) return comentariosTs(arquivo, normalizado)
  return []
}

/** Texto comparável de um comentário: sem diferença de espaço nem de quebra de linha. */
export function normal(texto: string): string {
  return colapsarEspacos(texto)
}

// Classes de um comentário do depois, pelo diff da tentativa.
export type Classe = 'acrescentado' | 'alterado' | 'movido' | 'mantido'
export type Classificado = Comentario & { classe: Classe; antigo: Comentario | null }

type Hunk = { a: number; b: number; c: number; d: number }

export type AnaliseDoArquivo = {
  caminho: string
  anterior: string | null
  antes: string
  depois: string
  comentariosAntes: Comentario[]
  comentarios: Classificado[]
  removidos: Comentario[]
  /** Linhas do depois que a tentativa acrescentou ou alterou (diff sem mudança só de espaço). */
  mudadasDepois: Set<number>
  /** Linhas do antes que a tentativa tirou ou alterou. */
  mudadasAntes: Set<number>
  exportsMudaram: boolean
  /** Nomes das linhas removidas que sumiram do arquivo, para o comentarios-marca. */
  sumidos: string[]
}

function hunks(diff: string): Hunk[] {
  const lista: Hunk[] = []
  for (const m of diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
    lista.push({
      a: Number(m[1]),
      b: m[2] === undefined ? 1 : Number(m[2]),
      c: Number(m[3]),
      d: m[4] === undefined ? 1 : Number(m[4]),
    })
  }
  return lista
}

function intervalo(de: number, quantos: number): number[] {
  return Array.from({ length: quantos }, (_, i) => de + i)
}

/** Linha do antes de uma linha do depois que a tentativa não mudou. */
function paraAntes(lista: Hunk[], n: number): number {
  let delta = 0
  for (const h of lista) {
    const fimNoDepois = h.d === 0 ? h.c : h.c + h.d - 1
    if (n > fimNoDepois) delta += h.d - h.b
  }
  return n - delta
}

function exportados(arquivo: string, fonte: string): string[] {
  if (!EXT_TS.has(path.extname(arquivo).toLowerCase())) return []
  const sf = ts.createSourceFile(arquivo, fonte, ts.ScriptTarget.Latest, true, tipoDeScript(arquivo))
  const nomes: string[] = []
  for (const s of sf.statements) {
    if (ts.isExportDeclaration(s)) {
      if (s.exportClause && ts.isNamedExports(s.exportClause))
        nomes.push(...s.exportClause.elements.map((e) => e.name.text))
      else nomes.push(`* de ${s.moduleSpecifier?.getText(sf) ?? ''}`)
      continue
    }
    if (ts.isExportAssignment(s)) {
      nomes.push('default')
      continue
    }
    const modificadores = ts.canHaveModifiers(s) ? ts.getModifiers(s) : undefined
    if (!modificadores?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
    if (modificadores.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) nomes.push('default')
    else if (ts.isVariableStatement(s)) nomes.push(...s.declarationList.declarations.map((d) => d.name.getText(sf)))
    else {
      const nome = (s as { name?: ts.Node }).name
      if (nome) nomes.push(nome.getText(sf))
    }
  }
  return nomes.sort()
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function analisarArquivo(ctx: Contexto, caminho: string, anterior: string | null): AnaliseDoArquivo | null {
  const antes = lerArquivo(ctx, ctx.inicio, anterior ?? caminho) ?? ''
  const depois = lerArquivo(ctx, ctx.final, caminho)
  if (depois === null) return null
  const comentariosAntes = antes ? extrairComentarios(anterior ?? caminho, antes) : []
  const novos = extrairComentarios(caminho, depois)
  const linhasDepois = depois.replace(/\r\n/g, '\n').split('\n')
  const linhasAntes = antes.replace(/\r\n/g, '\n').split('\n')

  let lista: Hunk[]
  if (!antes) {
    lista = [{ a: 0, b: 0, c: 1, d: linhasDepois.length }]
  } else {
    const blobAntes = gitOk(['rev-parse', `${ctx.inicio}:${anterior ?? caminho}`], ctx.ws.repo, ctx.env)
    const blobDepois = gitOk(['rev-parse', `${ctx.final}:${caminho}`], ctx.ws.repo, ctx.env)
    const diff = git(
      ['diff', '-U0', '-w', '--diff-algorithm=histogram', '--no-color', '--no-ext-diff', blobAntes, blobDepois],
      ctx.ws.repo,
      ctx.env,
    ).saida
    lista = hunks(diff)
  }
  const mudadasDepois = new Set(lista.flatMap((h) => intervalo(h.c, h.d)))
  const mudadasAntes = new Set(lista.flatMap((h) => intervalo(h.a, h.b)))

  const usados = new Set<Comentario>()
  const comentarios: Classificado[] = novos.map((c) => {
    const linhas = intervalo(c.inicio, c.fim - c.inicio + 1)
    const iguais = linhas.filter((n) => !mudadasDepois.has(n))
    const mudou = iguais.length < linhas.length
    const porMapa = comentariosAntes.filter((a) =>
      iguais.some((n) => {
        const velha = paraAntes(lista, n)
        return velha >= a.inicio && velha <= a.fim
      }),
    )
    if (!mudou) {
      const antigo = porMapa[0] ?? null
      if (antigo) usados.add(antigo)
      return { ...c, classe: 'mantido', antigo }
    }
    const tocam = lista.filter((h) => h.d > 0 && h.c <= c.fim && h.c + h.d - 1 >= c.inicio && h.b > 0)
    const porHunk = comentariosAntes.filter((a) => tocam.some((h) => h.a <= a.fim && h.a + h.b - 1 >= a.inicio))
    const candidatos = [...new Set([...porMapa, ...porHunk])]
    const igual = candidatos.find((a) => normal(a.texto) === normal(c.texto))
    if (igual) {
      // O texto é o mesmo e só o código da linha mudou (comentário no fim de uma linha alterada).
      usados.add(igual)
      return { ...c, classe: 'mantido', antigo: igual }
    }
    if (candidatos.length) {
      usados.add(candidatos[0])
      return { ...c, classe: 'alterado', antigo: candidatos[0] }
    }
    const movido = comentariosAntes.find(
      (a) =>
        !usados.has(a) &&
        normal(a.texto) === normal(c.texto) &&
        intervalo(a.inicio, a.fim - a.inicio + 1).some((n) => mudadasAntes.has(n)),
    )
    if (movido) {
      usados.add(movido)
      return { ...c, classe: 'movido', antigo: movido }
    }
    return { ...c, classe: 'acrescentado', antigo: null }
  })
  const textosNovos = new Set(novos.map((c) => normal(c.texto)))
  const removidos = comentariosAntes.filter((a) => !usados.has(a) && !textosNovos.has(normal(a.texto)))

  const removidas = [...mudadasAntes].map((n) => linhasAntes[n - 1] ?? '').join('\n')
  const nomes = new Set(removidas.match(/[A-Za-z_$][\w$]{2,}/g) ?? [])
  const sumidos = [...nomes].filter((nome) => !new RegExp(`(?<![\\w$])${escaparRegex(nome)}(?![\\w$])`).test(depois))
  return {
    caminho,
    anterior,
    antes,
    depois,
    comentariosAntes,
    comentarios,
    removidos,
    mudadasDepois,
    mudadasAntes,
    exportsMudaram:
      JSON.stringify(exportados(anterior ?? caminho, antes)) !== JSON.stringify(exportados(caminho, depois)),
    sumidos,
  }
}

/** A análise dos arquivos de código mudados pela tentativa, feita uma vez e dividida entre os avaliadores. */
export function analisarComentarios(ctx: Contexto): AnaliseDoArquivo[] {
  const guardada = ctx.memoria.get('comentarios') as AnaliseDoArquivo[] | undefined
  if (guardada) return guardada
  const analises = ctx.mudancas
    .filter((m) => m.status !== 'D' && temComentarios(m.caminho))
    .map((m) => analisarArquivo(ctx, m.caminho, m.anterior))
    .filter((a): a is AnaliseDoArquivo => a !== null)
  ctx.memoria.set('comentarios', analises)
  return analises
}

/** O trecho com o número de cada linha e `+` nas que a tentativa acrescentou ou alterou. */
export function renderizar(texto: string, faixa: Faixa | null, mudadas: Set<number> | null): string {
  if (!faixa) return '(nenhum código depois do comentário)'
  const linhas = texto.replace(/\r\n/g, '\n').split('\n')
  const largura = String(faixa.fim).length
  const saida: string[] = []
  for (let n = faixa.inicio; n <= faixa.fim; n++) {
    saida.push(`${String(n).padStart(largura)} ${mudadas?.has(n) ? '+' : ' '} ${linhas[n - 1] ?? ''}`)
  }
  return saida.join('\n')
}

export type Alvo = { analise: AnaliseDoArquivo; comentario: Classificado }

/** Os comentários que a tentativa acrescentou ou alterou, sem as diretivas. */
export function comentariosNovos(analises: AnaliseDoArquivo[]): Alvo[] {
  return analises.flatMap((analise) =>
    analise.comentarios
      .filter((c) => (c.classe === 'acrescentado' || c.classe === 'alterado') && !c.diretiva)
      .map((comentario) => ({ analise, comentario })),
  )
}

// Narração da tarefa (evals/README.md, comentarios-narracao): limites que entendem acento, porque o \b do
// JavaScript não entende. Só vale depois de dar zero disparos nos comentários do base.
const ANTES = '(?<![\\p{L}\\p{N}_])'
const DEPOIS = '(?![\\p{L}\\p{N}_])'
const DEFINITIVAS = [
  'mudei',
  'mudamos',
  'troquei',
  'trocamos',
  'alterei',
  'alteramos',
  'corrigi',
  'corrigimos',
  'foi alterad[oa]',
  'foram alterad[oa]s',
  'foi mudad[oa]',
  'foram mudad[oa]s',
  'foi trocad[oa]',
  'foram trocad[oa]s',
  'foi corrigid[oa]',
  'foram corrigid[oa]s',
  'foi atualizad[oa]',
  'foram atualizad[oa]s',
  'alterad[oa]s? para',
  'mudad[oa]s? para',
  'trocad[oa]s? (?:por|para)',
  'agora',
  'antes (?:era|eram|usava|usavam|tinha|tinham|ficava|ficavam|estava|estavam)',
  'conforme (?:o )?(?:pedido|solicitado)',
  'a pedido',
  'como pedido',
  'como solicitado',
  'nesta tarefa',
  'neste (?:pr|commit|pedido)',
  'versão corrigida',
  'issue\\s*#?\\d+',
  'pr\\s*#\\d+',
]
export const NARRACAO = new RegExp(`${ANTES}(?:${DEFINITIVAS.join('|')})${DEPOIS}`, 'iu')
export const NARRACAO_AMBIGUA = new RegExp(`${ANTES}nov[oa]s?${DEPOIS}`, 'iu')

/** O texto sem o que está entre crases: nome de código não é narração nem palavra de idioma. */
export function semCodigo(texto: string): string {
  return texto.replace(/`[^`]*`/g, ' ')
}

export function narracao(texto: string): { definitiva: string | null; ambigua: string | null } {
  const limpo = semCodigo(texto)
  return { definitiva: limpo.match(NARRACAO)?.[0] ?? null, ambigua: limpo.match(NARRACAO_AMBIGUA)?.[0] ?? null }
}

// Palavras funcionais, sem as que existem nas duas línguas ("a", "as", "do", "no", "se"). O "e" só existe no português.
const INGLES = new Set(
  'the and is are this that these those when with from into for of to in on it its be was were will would should can not if then else only but by an we you which what how why there here has have does'.split(
    ' ',
  ),
)
const PORTUGUES = new Set(
  'o os e um uma uns umas de da dos das em na nas nos é que para com por pelo pela pelos pelas não ao aos à às mais como quando ou mas seu sua seus suas este esta isso essa esse isto só também sem até entre cada depois antes onde já ainda ele ela eles elas'.split(
    ' ',
  ),
)

/** Conta as palavras funcionais das duas línguas, sem nomes de código (entre crases, com ponto ou em camelCase). */
export function idioma(texto: string): { ingles: number; portugues: number } {
  const palavras = semCodigo(texto)
    .split(/[^\p{L}\p{N}_$.()]+/u)
    .filter((p) => /^\p{L}+$/u.test(p) && !/\p{Ll}\p{Lu}/u.test(p))
    .map((p) => p.toLowerCase())
  return {
    ingles: palavras.filter((p) => INGLES.has(p)).length,
    portugues: palavras.filter((p) => PORTUGUES.has(p)).length,
  }
}

/** Um nome que existia nas linhas removidas, sumiu do arquivo e aparece entre crases no comentário. */
export function marca(analise: AnaliseDoArquivo, comentario: Comentario): string | null {
  for (const m of comentario.texto.matchAll(/`([^`]+)`/g)) {
    const sumido = analise.sumidos.find((nome) => new RegExp(`(?<![\\w$])${escaparRegex(nome)}(?![\\w$])`).test(m[1]))
    if (sumido) return sumido
  }
  return null
}

export type Candidato = { analise: AnaliseDoArquivo; comentario: Classificado; motivo: string }

/**
 * Os comentários que a tentativa não mudou e que podem ter ficado desatualizados: mantido cujo trecho ganhou, perdeu
 * ou mudou linha; movido cujo trecho mudou; cabeçalho cujos `export` mudaram; e todo o que cita entre crases um nome
 * que sumiu (comentarios-marca).
 */
export function candidatosADesatualizado(analises: AnaliseDoArquivo[]): Candidato[] {
  const lista: Candidato[] = []
  for (const analise of analises) {
    for (const c of analise.comentarios) {
      if ((c.classe !== 'mantido' && c.classe !== 'movido') || c.diretiva) continue
      const nome = marca(analise, c)
      let motivo: string | null = nome ? `cita \`${nome}\`, que sumiu do arquivo` : null
      if (!motivo && c.tipo === 'cabecalho') {
        if (analise.exportsMudaram) motivo = 'cabeçalho de arquivo cujos export mudaram'
      } else if (!motivo && c.classe === 'mantido' && c.trecho) {
        const velho = c.antigo?.trecho
        const ganhou = intervalo(c.trecho.inicio, c.trecho.fim - c.trecho.inicio + 1).some((n) =>
          analise.mudadasDepois.has(n),
        )
        const perdeu = velho
          ? intervalo(velho.inicio, velho.fim - velho.inicio + 1).some((n) => analise.mudadasAntes.has(n))
          : false
        const tamanho = velho ? velho.fim - velho.inicio !== c.trecho.fim - c.trecho.inicio : false
        if (ganhou || perdeu || tamanho) motivo = 'o trecho de um comentário mantido mudou'
      } else if (!motivo && c.classe === 'movido') {
        const textoDoTrecho = (texto: string, f: Faixa | null) =>
          f
            ? normal(
                texto
                  .split('\n')
                  .slice(f.inicio - 1, f.fim)
                  .join('\n'),
              )
            : ''
        if (textoDoTrecho(analise.antes, c.antigo?.trecho ?? null) !== textoDoTrecho(analise.depois, c.trecho)) {
          motivo = 'comentário movido cujo trecho mudou'
        }
      }
      if (motivo) lista.push({ analise, comentario: c, motivo })
    }
  }
  return lista
}

/** O miolo de um item para as rubricas descreve e porque. */
export function itemDeComentario(alvo: Alvo): string {
  const { analise, comentario } = alvo
  return [
    `<arquivo>${analise.caminho}</arquivo>`,
    `<comentario>\n${comentario.texto}\n</comentario>`,
    `<trecho>\n${renderizar(analise.depois, comentario.trecho, analise.mudadasDepois)}\n</trecho>`,
  ].join('\n')
}
