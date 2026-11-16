// sem-comentario-novo (casos `nao-deve`): os comentários dos arquivos tocados ficam como no base. Nenhum acrescentado,
// alterado ou removido; um comentário que só mudou de lugar, com o mesmo texto, não conta.
import { extrairComentarios, normal, temComentarios } from './comentarios.ts'
import { lerArquivo, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

/** O que sobra de `a` depois de tirar, um por um, os itens de `b`. */
function diferenca(a: string[], b: string[]): string[] {
  const resto = [...b]
  return a.filter((x) => {
    const i = resto.indexOf(x)
    if (i === -1) return true
    resto.splice(i, 1)
    return false
  })
}

export const semComentarioNovo: Avaliador = {
  nome: 'sem-comentario-novo',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const mudancas: { arquivo: string; acrescentados: string[]; removidos: string[] }[] = []
    for (const m of ctx.mudancas.filter(
      (m) => temComentarios(m.caminho) || (m.anterior && temComentarios(m.anterior)),
    )) {
      const antes = m.status === 'A' ? '' : (lerArquivo(ctx, ctx.inicio, m.anterior ?? m.caminho) ?? '')
      const depois = m.status === 'D' ? '' : (lerArquivo(ctx, ctx.final, m.caminho) ?? '')
      const textosAntes = extrairComentarios(m.anterior ?? m.caminho, antes).map((c) => normal(c.texto))
      const textosDepois = extrairComentarios(m.caminho, depois).map((c) => normal(c.texto))
      const acrescentados = diferenca(textosDepois, textosAntes)
      const removidos = diferenca(textosAntes, textosDepois)
      if (acrescentados.length || removidos.length) mudancas.push({ arquivo: m.caminho, acrescentados, removidos })
    }
    const curto = (t: string) => `"${t.slice(0, 120)}"`
    return {
      status: mudancas.length ? 'falha' : 'passa',
      resumo: mudancas.length
        ? mudancas
            .map((m) =>
              [
                m.arquivo,
                m.acrescentados.length ? `acrescentou ${m.acrescentados.map(curto).join(', ')}` : '',
                m.removidos.length ? `tirou ${m.removidos.map(curto).join(', ')}` : '',
              ]
                .filter(Boolean)
                .join(': '),
            )
            .join('; ')
        : 'nenhum comentário acrescentado, alterado ou removido',
      detalhes: mudancas,
    }
  },
}
