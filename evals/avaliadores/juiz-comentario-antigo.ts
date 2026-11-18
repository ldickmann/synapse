// juiz-comentario-antigo: o comentário que a tentativa não mudou e que ficou acima de código alterado ainda descreve
// o trecho (rubricas/juiz-comentario-antigo.md). Os candidatos vêm de candidatosADesatualizado, com as marcas do
// comentarios-marca.
import { analisarComentarios, candidatosADesatualizado, renderizar } from './comentarios.ts'
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'
import { julgarComentarios } from './juiz-comentario-descreve.ts'

export const juizComentarioAntigo: Avaliador = {
  nome: 'juiz-comentario-antigo',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const itens = candidatosADesatualizado(analisarComentarios(ctx)).map(({ analise, comentario, motivo }, i) => ({
      id: `a${i + 1}`,
      onde: `${analise.caminho}:${comentario.inicio} (${motivo})`,
      conteudo: [
        `<arquivo>${analise.caminho}</arquivo>`,
        `<comentario>\n${comentario.texto}\n</comentario>`,
        `<antes>\n${renderizar(analise.antes, comentario.antigo?.trecho ?? null, null)}\n</antes>`,
        `<depois>\n${renderizar(analise.depois, comentario.trecho, analise.mudadasDepois)}\n</depois>`,
      ].join('\n'),
    }))
    return julgarComentarios(ctx, 'juiz-comentario-antigo', itens)
  },
}
