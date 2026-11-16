// juiz-comentario-descreve: cada comentário acrescentado ou alterado descreve o seu trecho
// (rubricas/juiz-comentario-descreve.md). O que já reprovou por narração na regex não vai ao juiz.
import { analisarComentarios, comentariosNovos, itemDeComentario, narracao } from './comentarios.ts'
import { statusPelosItens, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

/** Os itens das rubricas descreve e porque: os comentários novos, sem os que narram a tarefa pela regex. */
export function itensDosComentariosNovos(ctx: Contexto): { id: string; conteudo: string; onde: string }[] {
  return comentariosNovos(analisarComentarios(ctx))
    .filter((alvo) => narracao(alvo.comentario.texto).definitiva === null)
    .map((alvo, i) => ({
      id: `c${i + 1}`,
      conteudo: itemDeComentario(alvo),
      onde: `${alvo.analise.caminho}:${alvo.comentario.inicio}`,
    }))
}

/** Julga os itens com uma rubrica e resume: sem itens passa; sem juiz, não roda. */
export async function julgarComentarios(
  ctx: Contexto,
  rubrica: string,
  itens: { id: string; conteudo: string; onde: string }[],
): Promise<ResultadoDoAvaliador> {
  if (!itens.length) return { status: 'passa', resumo: 'nenhum comentário para julgar' }
  if (!ctx.juiz) {
    return { status: 'nao-rodou', resumo: `${itens.length} item(ns) sem juiz: ${itens.map((i) => i.onde).join(', ')}` }
  }
  const julgados = await ctx.juiz.julgar(
    rubrica,
    itens.map(({ id, conteudo }) => ({ id, conteudo })),
  )
  const onde = new Map(itens.map((i) => [i.id, i.onde]))
  return {
    status: statusPelosItens(julgados),
    resumo: julgados
      .map((j) => `${onde.get(j.id)} ${j.veredito} (${j.votos.map((v) => v.veredito).join(', ')}): ${j.justificativa}`)
      .join('; '),
    itens: julgados,
  }
}

export const juizComentarioDescreve: Avaliador = {
  nome: 'juiz-comentario-descreve',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    return julgarComentarios(ctx, 'juiz-comentario-descreve', itensDosComentariosNovos(ctx))
  },
}
