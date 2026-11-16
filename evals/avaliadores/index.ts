// Os avaliadores, na ordem em que rodam numa tentativa: os que só leem o git primeiro, os de juiz depois e o build
// com os testes por último, que é o mais demorado. Um caso usa os da lista `avaliadores` do caso.json, que decidem,
// mais os informativos, que só aparecem no relatório.
import { checagensDoSite } from './checagens-do-site.ts'
import type { Avaliador } from './contexto.ts'
import { escopoArquivos } from './escopo-arquivos.ts'
import { fluxoGit } from './fluxo-git.ts'
import { pedidoCumprido } from './pedido-cumprido.ts'
import { semAfrouxar } from './sem-afrouxar.ts'
import { transcricao } from './transcricao.ts'

export const AVALIADORES: Avaliador[] = [
  transcricao,
  fluxoGit,
  escopoArquivos,
  pedidoCumprido,
  semAfrouxar,
  checagensDoSite,
]

/** Os avaliadores de um caso, na ordem de AVALIADORES. Nome que não existe é erro: o caso não rodaria inteiro. */
export function avaliadoresDoCaso(nomes: string[]): Avaliador[] {
  const faltam = nomes.filter((n) => !AVALIADORES.some((a) => a.nome === n))
  if (faltam.length) throw new Error(`Avaliador sem implementação: ${faltam.join(', ')}`)
  return AVALIADORES.filter((a) => nomes.includes(a.nome) || a.informativo)
}
