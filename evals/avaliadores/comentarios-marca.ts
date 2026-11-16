// comentarios-marca: informativo. Lista os comentários que citam entre crases um nome que existia nas linhas removidas
// e sumiu do arquivo; cada um vai ao juiz-comentario-antigo como candidato forte a desatualizado.
import { analisarComentarios, candidatosADesatualizado } from './comentarios.ts'
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'

export const comentariosMarca: Avaliador = {
  nome: 'comentarios-marca',
  informativo: true,
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const marcados = candidatosADesatualizado(analisarComentarios(ctx)).filter((c) => c.motivo.startsWith('cita'))
    return {
      status: 'informa',
      resumo: marcados.length
        ? marcados.map((c) => `${c.analise.caminho}:${c.comentario.inicio} ${c.motivo}`).join('; ')
        : 'nenhum comentário cita nome que sumiu',
      detalhes: marcados.map((c) => ({ arquivo: c.analise.caminho, linha: c.comentario.inicio, motivo: c.motivo })),
    }
  },
}
