// pedido-cumprido: a verificação escrita para o caso. `codigo` roda as checagens de `pedido_cumprido.checagens` do
// caso.json (a forma de máquina das `verificacoes`); `juiz` manda o pedido, o critério e o diff dos arquivos esperados
// à rubrica pedido-cumprido.md. Sem nenhuma mudança nos arquivos esperados, reprova sem chamar o juiz.
import ts from 'typescript'
import { colapsarEspacos, git, gitOk, type Checagem } from '../runner/comum.ts'
import { lerArquivo, statusPelosItens, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

type Literal = string | number | boolean | null | Literal[] | { [chave: string]: Literal }

/** Valor de uma expressão feita só de literais (texto, número, lista, objeto e `+` entre textos), ou undefined. */
function avaliarLiteral(no: ts.Expression): Literal | undefined {
  if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) return no.text
  if (ts.isNumericLiteral(no)) return Number(no.text)
  if (no.kind === ts.SyntaxKind.TrueKeyword) return true
  if (no.kind === ts.SyntaxKind.FalseKeyword) return false
  if (no.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isParenthesizedExpression(no) || ts.isAsExpression(no) || ts.isSatisfiesExpression(no)) {
    return avaliarLiteral(no.expression)
  }
  if (ts.isBinaryExpression(no) && no.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const a = avaliarLiteral(no.left)
    const b = avaliarLiteral(no.right)
    return typeof a === 'string' && typeof b === 'string' ? a + b : undefined
  }
  if (ts.isArrayLiteralExpression(no)) {
    const lista: Literal[] = []
    for (const elemento of no.elements) {
      const valor = avaliarLiteral(elemento)
      if (valor === undefined) return undefined
      lista.push(valor)
    }
    return lista
  }
  if (ts.isObjectLiteralExpression(no)) {
    const objeto: { [chave: string]: Literal } = {}
    for (const prop of no.properties) {
      if (!ts.isPropertyAssignment(prop)) return undefined
      const nome = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined
      const valor = avaliarLiteral(prop.initializer)
      if (nome === undefined || valor === undefined) return undefined
      objeto[nome] = valor
    }
    return objeto
  }
  return undefined
}

/** O valor de `const <nome> = …` no nível de cima de um arquivo TypeScript. */
export function valorDaConstante(fonte: string, arquivo: string, nome: string): Literal | undefined {
  const sf = ts.createSourceFile(arquivo, fonte, ts.ScriptTarget.Latest, true)
  for (const instrucao of sf.statements) {
    if (!ts.isVariableStatement(instrucao)) continue
    for (const decl of instrucao.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === nome && decl.initializer) {
        return avaliarLiteral(decl.initializer)
      }
    }
  }
  return undefined
}

/** As primeiras células das linhas da tabela da seção `## <secao>.` de um Markdown. */
export function primeirasCelulas(markdown: string, secao: string): string[] | null {
  const linhas = markdown.replace(/\r\n/g, '\n').split('\n')
  const inicio = linhas.findIndex((l) => new RegExp(`^## ${secao.replace('.', '\\.')}[.\\s]`).test(l))
  if (inicio === -1) return null
  const celulas: string[] = []
  for (const linha of linhas.slice(inicio + 1)) {
    if (linha.startsWith('## ')) break
    if (!linha.trimStart().startsWith('|')) continue
    const primeira = colapsarEspacos(linha.trim().split('|')[1] ?? '')
    if (primeira && !/^:?-+:?$/.test(primeira)) celulas.push(primeira)
  }
  return celulas
}

type Verificacao = { checagem: string; passa: boolean; evidencia: string }

function temALinha(texto: string | null, checagem: { secao: string; primeira_celula: string }): boolean | null {
  if (texto === null) return null
  const celulas = primeirasCelulas(texto, checagem.secao)
  return celulas === null ? null : celulas.includes(colapsarEspacos(checagem.primeira_celula))
}

function executarChecagem(ctx: Contexto, checagem: Checagem): Verificacao {
  const valorEsperado = ctx.caso.pedido_cumprido.tipo === 'codigo' ? ctx.caso.pedido_cumprido.valor_esperado : undefined
  if (checagem.tipo === 'valor-igual' || checagem.tipo === 'valor-igual-ao-base') {
    const depois = lerArquivo(ctx, ctx.final, checagem.arquivo)
    const valor = depois === null ? undefined : valorDaConstante(depois, checagem.arquivo, checagem.nome)
    let esperado: Literal | undefined = valorEsperado
    if (checagem.tipo === 'valor-igual-ao-base') {
      const antes = lerArquivo(ctx, ctx.inicio, checagem.arquivo)
      esperado = antes === null ? undefined : valorDaConstante(antes, checagem.arquivo, checagem.nome)
    }
    const passa = valor !== undefined && esperado !== undefined && JSON.stringify(valor) === JSON.stringify(esperado)
    const descricao = checagem.tipo === 'valor-igual' ? 'o valor pedido' : 'o valor do base'
    return {
      checagem: `${checagem.nome} em ${checagem.arquivo} igual a ${descricao}`,
      passa,
      evidencia:
        valor === undefined
          ? `não deu para ler ${checagem.nome} como literal`
          : passa
            ? 'igual'
            : `diferente: ${JSON.stringify(valor).slice(0, 300)}`,
    }
  }
  if (checagem.tipo === 'linha-da-tabela-ausente') {
    const tem = temALinha(lerArquivo(ctx, ctx.final, checagem.arquivo), checagem)
    return {
      checagem: `a tabela do §${checagem.secao} de ${checagem.arquivo} sem a linha "${checagem.primeira_celula}"`,
      passa: tem === false,
      evidencia: tem === null ? 'seção ou arquivo não encontrado' : tem ? 'a linha continua lá' : 'a linha saiu',
    }
  }
  // removida-no-mesmo-commit: o commit em que a linha sai também muda `junto_com`.
  const commits = gitOk(['rev-list', '--reverse', `${ctx.inicio}..HEAD`], ctx.ws.repo, ctx.env)
    .split('\n')
    .filter(Boolean)
  let quem: string | null = null
  for (const commit of commits) {
    const antes = temALinha(lerArquivo(ctx, `${commit}^`, checagem.arquivo), checagem)
    const depois = temALinha(lerArquivo(ctx, commit, checagem.arquivo), checagem)
    if (antes === true && depois === false) quem = commit
  }
  const descricao = `o commit que tira a linha do §${checagem.secao} também muda ${checagem.junto_com}`
  if (!quem) {
    return { checagem: descricao, passa: false, evidencia: 'nenhum commit da tentativa tira a linha' }
  }
  const arquivos = gitOk(['diff-tree', '--no-commit-id', '--name-only', '-r', quem], ctx.ws.repo, ctx.env).split('\n')
  const assunto = git(['log', '-1', '--format=%s', quem], ctx.ws.repo, ctx.env).saida
  const passa = arquivos.includes(checagem.junto_com)
  return {
    checagem: descricao,
    passa,
    evidencia: `${quem.slice(0, 7)} ${assunto}: ${passa ? 'muda' : 'não muda'} ${checagem.junto_com} (${arquivos.join(', ')})`,
  }
}

export const pedidoCumprido: Avaliador = {
  nome: 'pedido-cumprido',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const pc = ctx.caso.pedido_cumprido
    if (pc.tipo === 'codigo') {
      const verificacoes = pc.checagens.map((c) => executarChecagem(ctx, c))
      const falhas = verificacoes.filter((v) => !v.passa)
      return {
        status: falhas.length ? 'falha' : 'passa',
        resumo: falhas.length
          ? falhas.map((v) => `${v.checagem}: ${v.evidencia}`).join('; ')
          : `${verificacoes.length} verificações passaram`,
        detalhes: verificacoes,
      }
    }
    const diff = gitOk(
      ['diff', '-U15', '--no-color', ctx.inicio, ctx.final, '--', ...ctx.caso.arquivos_esperados],
      ctx.ws.repo,
      ctx.env,
    )
    if (!diff.trim()) return { status: 'falha', resumo: 'nenhuma mudança nos arquivos esperados' }
    if (!ctx.juiz) return { status: 'nao-rodou', resumo: 'precisa do juiz, e a rodada está sem juiz' }
    const itens = await ctx.juiz.julgar('pedido-cumprido', [
      {
        id: 'p1',
        conteudo: `<pedido>\n${ctx.caso.pedido}\n</pedido>\n<criterio>\n${pc.criterio}\n</criterio>\n<diff>\n${diff}\n</diff>`,
      },
    ])
    return {
      status: statusPelosItens(itens),
      resumo: `juiz: ${itens[0].veredito} (${itens[0].votos.map((v) => v.veredito).join(', ')}): ${itens[0].justificativa}`,
      itens,
    }
  },
}
