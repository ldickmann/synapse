// escopo-arquivos: os arquivos tocados (diff e não rastreados, os dois lados de uma renomeação) estão em
// `arquivos_permitidos`, e todos os `arquivos_esperados` foram tocados.
import { caminhosTocados, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

export const escopoArquivos: Avaliador = {
  nome: 'escopo-arquivos',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const tocados = caminhosTocados(ctx)
    const fora = tocados.filter((c) => !ctx.caso.arquivos_permitidos.includes(c))
    const faltam = ctx.caso.arquivos_esperados.filter((c) => !tocados.includes(c))
    const problemas = [
      ...(fora.length ? [`fora dos permitidos: ${fora.join(', ')}`] : []),
      ...(faltam.length ? [`esperados sem mudança: ${faltam.join(', ')}`] : []),
    ]
    return {
      status: problemas.length ? 'falha' : 'passa',
      resumo: problemas.length ? problemas.join('; ') : `tocados: ${tocados.join(', ')}`,
      detalhes: { tocados, fora, faltam },
    }
  },
}
