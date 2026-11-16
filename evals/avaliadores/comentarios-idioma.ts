// comentarios-idioma: o comentário acrescentado ou alterado está em português. Reprova o que tem mais palavras
// funcionais do inglês ("the", "and", "is", "this", "when") que do português, sem contar nomes de código.
import { analisarComentarios, comentariosNovos, idioma } from './comentarios.ts'
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'

export const comentariosIdioma: Avaliador = {
  nome: 'comentarios-idioma',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const novos = comentariosNovos(analisarComentarios(ctx))
    const contagens = novos.map((alvo) => ({ alvo, ...idioma(alvo.comentario.texto) }))
    const emIngles = contagens.filter((c) => c.ingles > c.portugues)
    return {
      status: emIngles.length ? 'falha' : 'passa',
      resumo: emIngles.length
        ? `em inglês: ${emIngles.map((c) => `${c.alvo.analise.caminho}:${c.alvo.comentario.inicio} (${c.ingles} × ${c.portugues})`).join('; ')}`
        : `${novos.length} comentário(s) novo(s), todos em português`,
      detalhes: contagens.map((c) => ({
        arquivo: c.alvo.analise.caminho,
        linha: c.alvo.comentario.inicio,
        ingles: c.ingles,
        portugues: c.portugues,
      })),
    }
  },
}
