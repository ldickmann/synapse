// juiz-comentario-porque: cada comentário acrescentado ou alterado diz o porquê, a regra ou a armadilha, e não só
// repete o código (rubricas/juiz-comentario-porque.md). Os itens são os mesmos do juiz-comentario-descreve.
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'
import { itensDosComentariosNovos, julgarComentarios } from './juiz-comentario-descreve.ts'

export const juizComentarioPorque: Avaliador = {
  nome: 'juiz-comentario-porque',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    return julgarComentarios(ctx, 'juiz-comentario-porque', itensDosComentariosNovos(ctx))
  },
}
