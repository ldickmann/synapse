// O que um avaliador recebe: o caso, o workspace no estado final da tentativa e, quando houve agente, a transcrição.
// O estado final é a árvore de trabalho inteira (com o que ficou fora de commit e os arquivos novos), gravada como
// uma árvore do git: assim os avaliadores leem o que o agente produziu, commitado ou não.
import { rmSync } from 'node:fs'
import path from 'node:path'
import type { ResultadoDoAgente } from '../runner/agente.ts'
import { git, gitBruto, gitOk, type Ambiente, type Caso, type Suite } from '../runner/comum.ts'
import type { ItemJulgado, Juiz } from '../runner/juiz.ts'
import { ambienteDoWorkspace, type Workspace } from '../runner/workspace.ts'

export type StatusDoAvaliador = 'passa' | 'falha' | 'indeterminado' | 'nao-rodou' | 'informa'

export type ResultadoDoAvaliador = {
  status: StatusDoAvaliador
  /** Uma frase com o que decidiu, para a tabela do relatório. */
  resumo: string
  detalhes?: unknown
  itens?: ItemJulgado[]
}

export type Mudanca = { status: string; caminho: string; anterior: string | null }

export type Contexto = {
  caso: Caso
  suite: Suite
  ws: Workspace
  env: Ambiente
  inicio: string
  /** Árvore do git com o estado final da pasta de trabalho. */
  final: string
  head: string
  mudancas: Mudanca[]
  agente: ResultadoDoAgente | null
  juiz: Juiz | null
  /** Resultados de checagens-do-site por estado avaliado, para não repetir build e testes da mesma árvore. */
  cache: Map<string, ResultadoDoAvaliador>
  log: (mensagem: string) => void
  /** Memória dos avaliadores de comentário, que dividem a mesma análise. */
  memoria: Map<string, unknown>
}

export type ConferenciaDoBase = { ok: boolean; resumo: string; detalhes?: unknown }

export type Avaliador = {
  nome: string
  /** Informativo: aparece no relatório e não decide a tentativa. */
  informativo?: true
  avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador>
  /** Conferência que o avaliador precisa passar no commit base antes de valer, feita na rodada sem modelo. */
  conferirNoBase?(ws: Workspace): Promise<ConferenciaDoBase>
}

/** Grava a pasta de trabalho inteira numa árvore do git, por um índice temporário, sem mexer no índice do agente. */
export function arvoreFinal(ws: Workspace): string {
  const indice = path.join(ws.pasta, 'indice-final')
  rmSync(indice, { force: true })
  const env = { ...ambienteDoWorkspace(ws), GIT_INDEX_FILE: indice }
  gitOk(['read-tree', 'HEAD'], ws.repo, env)
  gitOk(['add', '-A'], ws.repo, env)
  const arvore = gitOk(['write-tree'], ws.repo, env)
  rmSync(indice, { force: true })
  return arvore
}

export function listarMudancas(ws: Workspace, de: string, para: string): Mudanca[] {
  const saida = gitOk(['diff', '--name-status', '-M', '-z', de, para], ws.repo, ambienteDoWorkspace(ws))
  const partes = saida.split('\0').filter((p) => p !== '')
  const mudancas: Mudanca[] = []
  for (let i = 0; i < partes.length;) {
    const status = partes[i++]
    if (/^[RC]/.test(status)) {
      const anterior = partes[i++]
      mudancas.push({ status: status[0], caminho: partes[i++], anterior })
    } else {
      mudancas.push({ status: status[0], caminho: partes[i++], anterior: null })
    }
  }
  return mudancas
}

export type OpcoesDoContexto = Pick<Contexto, 'caso' | 'suite' | 'ws' | 'agente' | 'juiz' | 'cache' | 'log'>

export function montarContexto(opcoes: OpcoesDoContexto): Contexto {
  const env = ambienteDoWorkspace(opcoes.ws)
  const final = arvoreFinal(opcoes.ws)
  return {
    ...opcoes,
    env,
    inicio: opcoes.ws.inicio,
    final,
    head: gitOk(['rev-parse', 'HEAD'], opcoes.ws.repo, env),
    mudancas: listarMudancas(opcoes.ws, opcoes.ws.inicio, final),
    memoria: new Map(),
  }
}

/** Conteúdo de um arquivo numa árvore ou commit, ou null se ele não existe lá. */
export function lerArquivo(ctx: Pick<Contexto, 'ws' | 'env'>, arvore: string, caminho: string): string | null {
  if (git(['cat-file', '-e', `${arvore}:${caminho}`], ctx.ws.repo, ctx.env).status !== 0) return null
  return gitBruto(['cat-file', '-p', `${arvore}:${caminho}`], ctx.ws.repo, ctx.env).saida
}

/** Os caminhos tocados pela tentativa: o de antes e o de depois de cada mudança. */
export function caminhosTocados(ctx: Pick<Contexto, 'mudancas'>): string[] {
  const tocados = new Set<string>()
  for (const m of ctx.mudancas) {
    tocados.add(m.caminho)
    if (m.anterior) tocados.add(m.anterior)
  }
  return [...tocados].sort()
}

/** Status de um avaliador de juiz pelos itens: algum FAIL reprova; sem FAIL, algum UNKNOWN deixa indeterminado. */
export function statusPelosItens(itens: ItemJulgado[]): StatusDoAvaliador {
  if (itens.some((i) => i.veredito === 'FAIL')) return 'falha'
  if (itens.some((i) => i.veredito === 'UNKNOWN')) return 'indeterminado'
  return 'passa'
}
