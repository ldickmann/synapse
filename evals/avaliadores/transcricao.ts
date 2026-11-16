// transcricao: informativo. Registra se o agente verificou depois da última edição, as ações negadas, os eventos de
// hook, servidor esquecido numa porta e o modelo de cada resposta. Marca a tentativa como contaminada se ela ler
// evals/, o plano, as transcrições reais ou outro workspace, chamar o gh ou buscar o site publicado.
import os from 'node:os'
import path from 'node:path'
import type { Evento } from '../runner/agente.ts'
import { LOCAL, RAIZ } from '../runner/comum.ts'
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'

type Uso = { nome: string; entrada: Record<string, unknown>; subagente: boolean }

/** As chamadas de ferramenta da transcrição, em ordem, da sessão principal e dos subagentes. */
export function usosDeFerramenta(eventos: Evento[]): Uso[] {
  const usos: Uso[] = []
  for (const e of eventos) {
    if (e.type !== 'assistant') continue
    const conteudo = (e.message as { content?: unknown } | undefined)?.content
    if (!Array.isArray(conteudo)) continue
    for (const bloco of conteudo as { type?: string; name?: string; input?: Record<string, unknown> }[]) {
      if (bloco.type === 'tool_use' && bloco.name) {
        usos.push({ nome: bloco.name, entrada: bloco.input ?? {}, subagente: Boolean(e.parent_tool_use_id) })
      }
    }
  }
  return usos
}

/** Texto comparável de caminhos: minúsculas, barras normais, `/c/…` do Git Bash como `c:/…` e sem barra dobrada. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .replaceAll('\\', '/')
    .replace(/\/{2,}/g, '/')
    .replace(/(^|[\s"'=(:])\/([a-z])\//g, '$1$2:/')
}

const EDICAO = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const CHECAGEM = /pnpm\s+(?:run\s+)?(?:lint|typecheck|build|formatar|verificar:)/

export const transcricao: Avaliador = {
  nome: 'transcricao',
  informativo: true,
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const agente = ctx.agente
    if (!agente) return { status: 'informa', resumo: 'sem agente (variante sem modelo)' }
    const usos = usosDeFerramenta(agente.eventos)
    const ferramentas: Record<string, number> = {}
    for (const u of usos) ferramentas[u.nome] = (ferramentas[u.nome] ?? 0) + 1
    const skills = usos
      .filter((u) => u.nome === 'Skill')
      .map((u) => String(u.entrada.skill ?? u.entrada.command ?? '?'))

    const ultimaEdicao = usos.findLastIndex((u) => EDICAO.has(u.nome))
    const depois = usos.slice(ultimaEdicao + 1)
    const verificou =
      ultimaEdicao === -1
        ? null
        : depois.some(
            (u) =>
              (u.nome === 'Skill' && u.entrada.skill === 'verificar') ||
              ((u.nome === 'Bash' || u.nome === 'PowerShell') && CHECAGEM.test(String(u.entrada.command ?? ''))),
          )

    const results = agente.eventos.filter((e) => e.type === 'result')
    const negadas = results.reduce(
      (maior, e) => Math.max(maior, Array.isArray(e.permission_denials) ? e.permission_denials.length : 0),
      0,
    )
    const hooks: Record<string, number> = {}
    for (const e of agente.eventos) {
      if (e.type !== 'system' || !String(e.subtype ?? '').startsWith('hook')) continue
      const nome = String(e.hook_event_name ?? e.hook_event ?? e.hook_name ?? '?')
      const chave = `${nome} ${String(e.subtype)}`
      hooks[chave] = (hooks[chave] ?? 0) + 1
    }

    // Lugares que a tentativa não pode ler: o repositório real (tem evals/ e os resultados), a pasta do plano, as
    // transcrições reais, a pasta das evals em LOCAL e qualquer outro workspace.
    const proibidos = [
      [normalizar(RAIZ), 'o repositório real'],
      [normalizar(path.join(path.dirname(RAIZ), 'planos')), 'a pasta do plano'],
      ['synapse-plano-evals', 'o plano'],
      [normalizar(path.join(os.homedir(), '.claude', 'projects')), 'as transcrições reais'],
      ['.claude/projects', 'as transcrições reais'],
      [normalizar(LOCAL), 'a pasta das evals'],
      ['synapse-evals', 'a pasta das evals'],
    ] as const
    // O endereço do site aparece no código (lib/metadados.ts); só conta buscar a página pela rede.
    const REDE = /\b(curl|wget|invoke-webrequest|iwr|invoke-restmethod|irm|fetch\()/
    const proprio = normalizar(ctx.ws.pasta)
    const raizWs = normalizar(ctx.suite.raiz_workspaces)
    const contaminacao = new Set<string>()
    for (const u of usos) {
      const texto = normalizar(JSON.stringify(u.entrada))
      for (const [trecho, onde] of proibidos) if (texto.includes(trecho)) contaminacao.add(`${u.nome} em ${onde}`)
      for (const m of texto.matchAll(new RegExp(`${raizWs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[a-z0-9]+`, 'g'))) {
        if (m[0] !== proprio) contaminacao.add(`${u.nome} em outro workspace (${m[0]})`)
      }
      const buscaNaRede = u.nome === 'WebFetch' || u.nome === 'WebSearch' || REDE.test(texto)
      if (buscaNaRede && /dlk-systems|pages\.dev/.test(texto)) contaminacao.add(`${u.nome} no site publicado`)
      if (/(^|[^a-z0-9_-])evals\//.test(texto)) contaminacao.add(`${u.nome} em evals/`)
      if ((u.nome === 'Bash' || u.nome === 'PowerShell') && /(^|[\s;&|(`"'])gh(\.exe)?\s/.test(texto)) {
        contaminacao.add(`${u.nome} chamou o gh`)
      }
    }

    const esperado = ctx.suite.agente.modelo
    const trocou = agente.modelos.principal.filter((m) => m !== esperado)
    const marcas = [
      ...(contaminacao.size ? [`contaminada: ${[...contaminacao].join('; ')}`] : []),
      ...(agente.servidorEsquecido.length
        ? [`servidor_esquecido: ${agente.servidorEsquecido.map((e) => `${e.porta} (pid ${e.pid})`).join(', ')}`]
        : []),
      ...(trocou.length ? [`troca de modelo: ${trocou.join(', ')}`] : []),
    ]
    return {
      status: 'informa',
      resumo: [
        verificou === null
          ? 'sem edição'
          : verificou
            ? 'verificou depois da última edição'
            : 'não verificou depois da última edição',
        `${negadas} ação(ões) negada(s)`,
        skills.length ? `skills: ${skills.join(', ')}` : 'sem skill',
        ...marcas,
      ].join('; '),
      detalhes: {
        verificouDepoisDaUltimaEdicao: verificou,
        acoesNegadas: negadas,
        ferramentas,
        skills,
        hooks,
        modelos: agente.modelos,
        marcas,
        contaminada: contaminacao.size > 0,
        servidorEsquecido: agente.servidorEsquecido,
      },
    }
  },
}
