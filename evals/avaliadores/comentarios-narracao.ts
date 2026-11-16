// comentarios-narracao: nenhum comentário acrescentado ou alterado narra a tarefa. A regex decide as palavras
// definitivas ("agora", "foi alterado", "conforme pedido"…); "novo" e "nova", que o base usa no sentido próprio,
// vão ao juiz com rubricas/comentarios-narracao.md. A regex só vale depois de dar zero disparos no base.
import { gitOk } from '../runner/comum.ts'
import { ambienteDoWorkspace, type Workspace } from '../runner/workspace.ts'
import {
  comentariosNovos,
  extrairComentarios,
  narracao,
  renderizar,
  temComentarios,
  analisarComentarios,
  NARRACAO_AMBIGUA,
  semCodigo,
} from './comentarios.ts'
import {
  lerArquivo,
  statusPelosItens,
  type Avaliador,
  type ConferenciaDoBase,
  type Contexto,
  type ResultadoDoAvaliador,
} from './contexto.ts'

export const comentariosNarracao: Avaliador = {
  nome: 'comentarios-narracao',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const novos = comentariosNovos(analisarComentarios(ctx))
    const definitivos = novos
      .map((alvo) => ({ alvo, palavra: narracao(alvo.comentario.texto).definitiva }))
      .filter((x): x is typeof x & { palavra: string } => x.palavra !== null)
    const ambiguos = novos
      .filter((alvo) => narracao(alvo.comentario.texto).definitiva === null)
      .map((alvo) => ({ alvo, palavra: narracao(alvo.comentario.texto).ambigua }))
      .filter((x): x is typeof x & { palavra: string } => x.palavra !== null)
    const descricao = (x: { alvo: (typeof novos)[number]; palavra: string }) =>
      `${x.alvo.analise.caminho}:${x.alvo.comentario.inicio} "${x.palavra}"`
    if (definitivos.length) {
      return {
        status: 'falha',
        resumo: `narra a tarefa: ${definitivos.map(descricao).join('; ')}`,
        detalhes: definitivos.map((x) => ({
          arquivo: x.alvo.analise.caminho,
          linha: x.alvo.comentario.inicio,
          palavra: x.palavra,
          comentario: x.alvo.comentario.texto,
        })),
      }
    }
    if (!ambiguos.length)
      return { status: 'passa', resumo: `${novos.length} comentário(s) novo(s), nenhum narra a tarefa` }
    if (!ctx.juiz)
      return { status: 'nao-rodou', resumo: `palavra ambígua sem juiz: ${ambiguos.map(descricao).join('; ')}` }
    const itens = await ctx.juiz.julgar(
      'comentarios-narracao',
      ambiguos.map((x, i) => ({
        id: `n${i + 1}`,
        conteudo: [
          `<comentario>\n${x.alvo.comentario.texto}\n</comentario>`,
          `<palavra>${x.palavra}</palavra>`,
          `<trecho>\n${renderizar(x.alvo.analise.depois, x.alvo.comentario.trecho, x.alvo.analise.mudadasDepois)}\n</trecho>`,
        ].join('\n'),
      })),
    )
    return {
      status: statusPelosItens(itens),
      resumo: itens.map((i) => `${i.id} ${i.veredito}: ${i.justificativa}`).join('; '),
      itens,
    }
  },

  async conferirNoBase(ws: Workspace): Promise<ConferenciaDoBase> {
    const env = ambienteDoWorkspace(ws)
    const arquivos = gitOk(['ls-tree', '-r', '--name-only', ws.inicio], ws.repo, env).split('\n').filter(temComentarios)
    const disparos: string[] = []
    let total = 0
    let ambiguos = 0
    for (const arquivo of arquivos) {
      const fonte = lerArquivo({ ws, env }, ws.inicio, arquivo) ?? ''
      for (const c of extrairComentarios(arquivo, fonte)) {
        total++
        const n = narracao(c.texto)
        if (n.definitiva) disparos.push(`${arquivo}:${c.inicio} "${n.definitiva}"`)
        if (NARRACAO_AMBIGUA.test(semCodigo(c.texto))) ambiguos++
      }
    }
    return {
      ok: disparos.length === 0,
      resumo: `${disparos.length} disparo(s) em ${total} comentários de ${arquivos.length} arquivos do base${disparos.length ? `: ${disparos.join('; ')}` : ''}; ${ambiguos} com palavra ambígua (vão ao juiz quando acrescentados)`,
      detalhes: { arquivos: arquivos.length, comentarios: total, disparos, ambiguos },
    }
  },
}
