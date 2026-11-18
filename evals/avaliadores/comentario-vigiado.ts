// comentario-vigiado (casos `deve`): o comentário que o pedido torna falso (`comentario_vigiado` do caso) não aparece
// mais no arquivo, comparado sem diferença de espaços: mudou ou saiu. Com `termos_proibidos`, o comentário que ficar
// logo acima da declaração que o vigiado acompanhava também não pode casar com a regex.
import ts from 'typescript'
import { colapsarEspacos } from '../runner/comum.ts'
import { extrairComentarios, normal } from './comentarios.ts'
import { lerArquivo, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

type Declaracao = ts.VariableStatement | ts.FunctionDeclaration | ts.ClassDeclaration

function declaracoes(sf: ts.SourceFile): Declaracao[] {
  const lista: Declaracao[] = []
  const visitar = (no: ts.Node): void => {
    if (ts.isVariableStatement(no) || ts.isFunctionDeclaration(no) || ts.isClassDeclaration(no)) lista.push(no)
    ts.forEachChild(no, visitar)
  }
  visitar(sf)
  return lista
}

function nomeDe(d: Declaracao, sf: ts.SourceFile): string | null {
  if (ts.isVariableStatement(d)) return d.declarationList.declarations[0]?.name.getText(sf) ?? null
  return d.name?.text ?? null
}

/** Os comentários entre a declaração anterior e esta: os que ficam logo acima dela. */
function comentariosAcima(fonte: string, d: Declaracao): string[] {
  return (ts.getLeadingCommentRanges(fonte, d.pos) ?? []).map((r) => fonte.slice(r.pos, r.end))
}

/** O nome da declaração que o comentário vigiado acompanha no base, como `PERGUNTAS`. */
function ancora(arquivo: string, antes: string, texto: string): string | null {
  const sf = ts.createSourceFile(arquivo, antes, ts.ScriptTarget.Latest, true)
  const alvo = normal(texto)
  for (const d of declaracoes(sf)) {
    if (comentariosAcima(antes, d).some((c) => normal(c).includes(alvo))) return nomeDe(d, sf)
  }
  return null
}

export const comentarioVigiado: Avaliador = {
  nome: 'comentario-vigiado',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const vigiado = ctx.caso.comentario_vigiado
    if (!vigiado) return { status: 'nao-rodou', resumo: 'o caso não tem comentario_vigiado' }
    const depois = lerArquivo(ctx, ctx.final, vigiado.arquivo)
    if (depois === null) return { status: 'passa', resumo: `${vigiado.arquivo} saiu, e o comentário com ele` }
    const alvo = colapsarEspacos(vigiado.texto)
    const comentarios = extrairComentarios(vigiado.arquivo, depois)
    const problemas: string[] = []
    if (colapsarEspacos(depois).includes(alvo) || comentarios.some((c) => normal(c.texto).includes(alvo))) {
      problemas.push(`"${vigiado.texto}" continua no arquivo`)
    }
    let acima: string[] = []
    if (vigiado.termos_proibidos) {
      const antes = lerArquivo(ctx, ctx.inicio, vigiado.arquivo) ?? ''
      const nome = ancora(vigiado.arquivo, antes, vigiado.texto)
      const sf = ts.createSourceFile(vigiado.arquivo, depois, ts.ScriptTarget.Latest, true)
      const declaracao = nome ? declaracoes(sf).find((d) => nomeDe(d, sf) === nome) : undefined
      acima = declaracao ? comentariosAcima(depois, declaracao) : []
      const regex = new RegExp(vigiado.termos_proibidos.regex, vigiado.termos_proibidos.flags)
      for (const comentario of acima) {
        const termo = comentario.match(regex)?.[0]
        if (termo)
          problemas.push(`o comentário acima de ${nome} tem "${termo}": ${colapsarEspacos(comentario).slice(0, 200)}`)
      }
    }
    return {
      status: problemas.length ? 'falha' : 'passa',
      resumo: problemas.length ? problemas.join('; ') : 'o comentário vigiado mudou ou saiu',
      detalhes: { comentarioAcima: acima },
    }
  },
}
