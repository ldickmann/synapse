// O juiz: outro `claude -p`, com outro modelo, sem ferramentas e sem o harness, numa pasta vazia fora de qualquer
// repositório e com config própria. Uma chamada por rubrica e por voto, com todos os itens da rubrica num lote;
// 3 votos por item, vale a maioria, e sem maioria o item fica UNKNOWN (evals/README.md, seção Juiz).
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ambienteBase, EVALS, executar, LOCAL, type Ambiente, type Suite } from './comum.ts'
import { conferirCredencial, localizarClaude } from './agente.ts'

export type Veredito = 'PASS' | 'FAIL' | 'UNKNOWN'
export type Voto = { veredito: Veredito; justificativa: string }

/** Um item a julgar: `conteudo` é o miolo entre <item> e </item>, já com as tags da rubrica (<comentario>, <trecho>…). */
export type ItemDoJuiz = { id: string; conteudo: string }

export type ItemJulgado = ItemDoJuiz & {
  rubrica: string
  votos: Voto[]
  veredito: Veredito
  justificativa: string
}

export type Juiz = {
  julgar(rubrica: string, itens: ItemDoJuiz[]): Promise<ItemJulgado[]>
  custoUsd(): number
  chamadas(): number
}

/** O juiz bateu no limite do plano ou num erro da API: a rodada para, como numa tentativa que não rodou. */
export class JuizNaoRodou extends Error {}

const ESQUEMA = {
  type: 'object',
  properties: {
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          veredito: { type: 'string', enum: ['PASS', 'FAIL', 'UNKNOWN'] },
          justificativa: { type: 'string', maxLength: 300 },
        },
        required: ['id', 'veredito', 'justificativa'],
        additionalProperties: false,
      },
    },
  },
  required: ['itens'],
  additionalProperties: false,
}

const NAO_RODOU = /usage limit|limit reached|hit your limit|rate.?limit|overloaded|authentication|invalid api key|529/i

/** Um item que tenta fechar a própria tag não sai do lugar dele no prompt. */
function semFechamento(texto: string): string {
  return texto.replaceAll('</item>', '<\\/item>')
}

export function montarPrompt(itens: ItemDoJuiz[]): string {
  const corpo = itens.map((item) => `<item>\n<id>${item.id}</id>\n${semFechamento(item.conteudo)}\n</item>`)
  return `Itens a julgar (${itens.length}):\n\n${corpo.join('\n\n')}\n`
}

/** Maioria de 3 (ou do número de votos): sem maioria, UNKNOWN. */
export function maioria(votos: Voto[]): Veredito {
  const contagem = new Map<Veredito, number>()
  for (const v of votos) contagem.set(v.veredito, (contagem.get(v.veredito) ?? 0) + 1)
  for (const [veredito, n] of contagem) if (n > votos.length / 2) return veredito
  return 'UNKNOWN'
}

export type OpcoesDoJuiz = { suite: Suite; token: string; log: (mensagem: string) => void }

export function criarJuiz(opcoes: OpcoesDoJuiz): Juiz {
  const { suite, log } = opcoes
  const vazia = path.join(LOCAL, 'juiz', 'vazia')
  const config = path.join(LOCAL, 'juiz', 'config')
  const tmp = path.join(LOCAL, 'juiz', 'tmp')
  for (const dir of [vazia, config, tmp]) mkdirSync(dir, { recursive: true })
  // A pasta do juiz não pode estar dentro de um repositório: o Claude Code procura CLAUDE.md nas pastas acima.
  const repo = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: vazia, encoding: 'utf8', windowsHide: true })
  if (repo.status === 0) throw new Error(`A pasta do juiz ${vazia} está dentro do repositório ${repo.stdout.trim()}.`)
  const env: Ambiente = {
    ...ambienteBase(),
    TEMP: tmp,
    TMP: tmp,
    CLAUDE_CONFIG_DIR: config,
    CLAUDE_CODE_OAUTH_TOKEN: opcoes.token,
    ENABLE_CLAUDEAI_MCP_SERVERS: 'false',
    DISABLE_AUTOUPDATER: '1',
  }
  conferirCredencial(env, vazia)
  let custo = 0
  let chamadas = 0

  async function votar(rubrica: string, sistema: string, prompt: string, ids: string[]): Promise<Map<string, Voto>> {
    const args = [
      '-p',
      '--model',
      suite.juiz.modelo,
      '--system-prompt',
      sistema,
      '--tools',
      '',
      '--output-format',
      'json',
      '--json-schema',
      JSON.stringify(ESQUEMA),
      '--strict-mcp-config',
      '--no-session-persistence',
      '--max-budget-usd',
      String(suite.juiz.teto_chamada_usd),
    ]
    let ultimoErro = ''
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      chamadas++
      const r = await executar(localizarClaude(), args, { cwd: vazia, env, entrada: prompt, tempoMs: 5 * 60_000 })
      let resposta: Record<string, unknown> | null = null
      try {
        resposta = JSON.parse(r.saida) as Record<string, unknown>
      } catch {
        resposta = null
      }
      custo += Number(resposta?.total_cost_usd ?? 0)
      if (resposta?.is_error === true || r.status !== 0) {
        ultimoErro = `${String(resposta?.result ?? '')} ${r.erro}`.trim()
        if (NAO_RODOU.test(ultimoErro)) throw new JuizNaoRodou(`juiz (${rubrica}): ${ultimoErro.slice(0, 300)}`)
        continue
      }
      let estruturado = resposta?.structured_output as { itens?: unknown } | undefined
      if (!estruturado && typeof resposta?.result === 'string') {
        try {
          estruturado = JSON.parse(resposta.result) as { itens?: unknown }
        } catch {
          estruturado = undefined
        }
      }
      if (!Array.isArray(estruturado?.itens)) {
        ultimoErro = 'a resposta não trouxe structured_output com itens'
        continue
      }
      const votos = new Map<string, Voto>()
      for (const item of estruturado.itens as { id?: unknown; veredito?: unknown; justificativa?: unknown }[]) {
        const veredito = item.veredito === 'PASS' || item.veredito === 'FAIL' ? item.veredito : 'UNKNOWN'
        if (typeof item.id === 'string' && ids.includes(item.id)) {
          votos.set(item.id, { veredito, justificativa: String(item.justificativa ?? '').slice(0, 300) })
        }
      }
      return votos
    }
    log(`juiz (${rubrica}): voto perdido, ${ultimoErro.slice(0, 200)}`)
    return new Map()
  }

  return {
    async julgar(rubrica, itens) {
      if (itens.length === 0) return []
      const sistema = readFileSync(path.join(EVALS, 'rubricas', `${rubrica}.md`), 'utf8')
      const prompt = montarPrompt(itens)
      const ids = itens.map((i) => i.id)
      const rodadas = await Promise.all(
        Array.from({ length: suite.juiz.votos }, () => votar(rubrica, sistema, prompt, ids)),
      )
      return itens.map((item) => {
        const votos = rodadas.map(
          (votosDaRodada) =>
            votosDaRodada.get(item.id) ?? { veredito: 'UNKNOWN' as const, justificativa: 'sem voto para o item' },
        )
        const veredito = maioria(votos)
        const justificativa = votos.find((v) => v.veredito === veredito)?.justificativa ?? ''
        return { ...item, rubrica, votos, veredito, justificativa }
      })
    },
    custoUsd: () => custo,
    chamadas: () => chamadas,
  }
}
