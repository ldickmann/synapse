// O formato de experimento.json e resultados.json, que o runner escreve e o relatório, o comparador e a rotulagem
// leem. Fica fora do rodar.ts porque ele roda a rodada ao ser importado.
import path from 'node:path'
import type { ConferenciaDoBase, ResultadoDoAvaliador } from '../avaliadores/contexto.ts'
import type { ResultadoDoAgente } from './agente.ts'
import { EVALS, lerJson, type Caso, type Conjunto, type Suite, type TipoDeCaso } from './comum.ts'
import { existsSync } from 'node:fs'

export type Modo = 'sem-modelo' | 'sonda' | 'rodada'
export type Variante = 'referencia' | 'quebrada' | 'nula'
export type StatusDaTentativa =
  'passa' | 'falha' | 'indeterminado' | 'corte' | 'nao-rodou' | 'tempo-esgotado' | 'avaliacao-pendente'

export type ResumoDoAgente = Omit<ResultadoDoAgente, 'eventos'> & { transcricao: string; mensagemFinal: string }

export type Registro = {
  /** `<caso>#<n>` numa tentativa com agente; `<caso>@<variante>` na rodada sem modelo. */
  id: string
  caso: string
  conjunto: Conjunto
  tipo: TipoDeCaso
  n: number | null
  variante: Variante | null
  status: StatusDaTentativa
  /** Na variante sem modelo: se o resultado bate com o que a variante precisa mostrar. */
  confere: 'sim' | 'nao' | 'pendente' | null
  avaliadores: Record<string, ResultadoDoAvaliador>
  agente: ResumoDoAgente | null
  juiz: { custoUsd: number; chamadas: number }
  marcas: string[]
  workspace: string | null
  inicio: string
  final: string
  diff: string | null
  quando: string
}

export type Experimento = {
  nome: string
  data: string
  modo: Modo
  base: Suite['base']
  claude_code: string
  versoes: Record<string, string>
  agente: Omit<Suite['agente'], 'esforco'> & { esforco: string | null }
  juiz: Suite['juiz'] | null
  tentativas: number
  teto_tentativa_usd: number
  orcamento_rodada_usd: number
  casos: string[]
  variantes: Variante[]
  harness_patch_sha256: string
  hipotese: string
  manter: boolean
  inicio: string
  fim: string | null
  parada: string | null
  /** Na rodada sem modelo: as conferências feitas no commit base, como a regex de narração sem disparo. */
  conferencias_do_base?: Record<string, ConferenciaDoBase>
}

export type Resultados = { tentativas: Registro[] }

export const PASTA_EXPERIMENTOS = path.join(EVALS, 'experimentos')
export const PASTA_EXPERIMENTOS_VALIDACAO = path.join(EVALS, 'validacao', 'experimentos')

/** A pasta de um experimento por nome (`2026-11-16-linha-de-base`) ou caminho, e a da validação dele. */
export function pastasDoExperimento(nomeOuCaminho: string): { dirExp: string; dirVal: string } {
  const nome = path.basename(path.resolve(nomeOuCaminho))
  return { dirExp: path.join(PASTA_EXPERIMENTOS, nome), dirVal: path.join(PASTA_EXPERIMENTOS_VALIDACAO, nome) }
}

/** Os registros de um experimento, do ajuste e da validação. */
export function lerRegistros(dirExp: string, dirVal: string): Registro[] {
  return [dirExp, dirVal].flatMap((dir) => {
    const arquivo = path.join(dir, 'resultados.json')
    return existsSync(arquivo) ? lerJson<Resultados>(arquivo).tentativas : []
  })
}

/** Avaliadores do comportamento: numa versão quebrada, é um deles que precisa reprovar. */
export const DO_COMPORTAMENTO = new Set([
  'comentario-vigiado',
  'sem-comentario-novo',
  'comentarios-narracao',
  'comentarios-idioma',
  'juiz-comentario-descreve',
  'juiz-comentario-porque',
  'juiz-comentario-antigo',
])

/** Status de uma tentativa avaliada: os avaliadores do caso decidem; os informativos não contam. */
export function statusPelosAvaliadores(
  caso: Caso,
  avaliadores: Record<string, ResultadoDoAvaliador>,
): StatusDaTentativa {
  const decisivos = caso.avaliadores.map((nome) => avaliadores[nome]?.status ?? 'nao-rodou')
  if (decisivos.includes('falha')) return 'falha'
  if (decisivos.some((s) => s === 'indeterminado' || s === 'nao-rodou')) return 'indeterminado'
  return 'passa'
}

/** O que a variante sem modelo precisa mostrar (evals/README.md, Como acrescentar um caso). */
export function conferirVariante(
  caso: Caso,
  variante: Variante,
  r: Record<string, ResultadoDoAvaliador>,
): Registro['confere'] {
  const s = (nome: string) => r[nome]?.status ?? 'nao-rodou'
  const decisivos = caso.avaliadores
  if (variante === 'nula') {
    if (s('pedido-cumprido') === 'falha') return 'sim'
    return s('pedido-cumprido') === 'nao-rodou' ? 'pendente' : 'nao'
  }
  if (variante === 'referencia') {
    if (decisivos.some((n) => s(n) === 'falha' || s(n) === 'indeterminado')) return 'nao'
    return decisivos.some((n) => s(n) === 'nao-rodou') ? 'pendente' : 'sim'
  }
  // A quebrada reprova no comportamento, e só nele: o resto do caso passa, para a falha ser do comportamento.
  const outros = decisivos.filter((n) => !DO_COMPORTAMENTO.has(n))
  if (outros.some((n) => s(n) === 'falha' || s(n) === 'indeterminado')) return 'nao'
  if (decisivos.some((n) => DO_COMPORTAMENTO.has(n) && s(n) === 'falha')) return 'sim'
  return decisivos.some((n) => s(n) === 'nao-rodou') ? 'pendente' : 'nao'
}
