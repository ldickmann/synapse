// A execução do agente numa tentativa: `claude -p` no workspace, com o harness do repositório carregado, dentro de
// um Job Object, com a transcrição stream-json gravada em LOCAL (evals/README.md e plano, seção 4.3).
import { spawn, spawnSync } from 'node:child_process'
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import {
  ambienteBase,
  esperar,
  naFaixa,
  paraSpawn,
  portasEmEscuta,
  type Ambiente,
  type Escuta,
  type Suite,
} from './comum.ts'
import { criarJob } from './job.ts'
import type { Workspace } from './workspace.ts'

export type Evento = Record<string, unknown> & { type?: string; subtype?: string }

export type StatusDoAgente = 'ok' | 'corte' | 'nao-rodou' | 'tempo-esgotado'

export type Init = {
  versao: string | null
  modelo: string | null
  modo: string | null
  esforco: string | null
  skills: string[]
  plugins: string[]
  mcp: string[]
  ferramentas: string[]
  origemDaChave: string | null
  problemas: string[]
}

export type ResultadoDoAgente = {
  status: StatusDoAgente
  /** O `subtype` do evento `result`, ou o motivo de não haver um. */
  fim: string
  custoUsd: number
  turnos: number | null
  duracaoS: number
  init: Init | null
  modelos: { principal: string[]; subagentes: string[] }
  servidorEsquecido: Escuta[]
  portasDeFora: Escuta[]
  /** O processo saiu sozinho antes do fim da carência. */
  saiuSozinho: boolean
  eventos: Evento[]
  stderr: string
}

export type OpcoesDoAgente = {
  suite: Suite
  ws: Workspace
  pedido: string
  modelo: string
  /** null deixa o esforço padrão do modelo (a sonda com Haiku). */
  esforco: string | null
  tetoUsd: number
  token: string
  transcricao: string
  /** Skills que o `system/init` precisa mostrar; vazio na sonda, que só registra. */
  skillsEsperadas: string[]
  log: (mensagem: string) => void
}

let claudeExe: string | null = null

/** Caminho do claude.exe pelo PATH do registro, o mesmo que o agente teria numa sessão aberta pelo Windows. */
export function localizarClaude(): string {
  if (claudeExe) return claudeExe
  const r = spawnSync('where.exe', ['claude'], { env: paraSpawn(ambienteBase()), encoding: 'utf8', windowsHide: true })
  const exe = (r.stdout ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /\.exe$/i.test(l))
  if (!exe) throw new Error('claude.exe não está no PATH.')
  claudeExe = exe
  return exe
}

/** Versão do Claude Code instalado, como `claude --version` imprime (`2.1.325 (Claude Code)` dá `2.1.325`). */
export function versaoDoClaude(): string {
  const r = spawnSync(localizarClaude(), ['--version'], {
    env: paraSpawn(ambienteBase()),
    encoding: 'utf8',
    windowsHide: true,
  })
  return (r.stdout ?? '').trim().split(/\s+/)[0] ?? ''
}

function textos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.map((v) => (typeof v === 'string' ? v : String((v as { name?: unknown })?.name ?? JSON.stringify(v))))
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

/**
 * O que o evento `system/init` diz da sessão, com a lista do que não bate com a suíte. Se o harness não carregou
 * (sem a skill `verificar`), a rodada para: a documentação avisa que o `--bare` vai virar o padrão do `-p`.
 */
export function conferirInit(
  evento: Evento,
  opcoes: Pick<OpcoesDoAgente, 'suite' | 'modelo' | 'esforco' | 'skillsEsperadas'>,
): Init {
  const init: Init = {
    versao: texto(evento.claude_code_version),
    modelo: texto(evento.model),
    modo: texto(evento.permissionMode),
    esforco: texto(evento.effort) ?? texto((evento as { effortLevel?: unknown }).effortLevel),
    skills: textos(evento.skills),
    plugins: textos(evento.plugins),
    mcp: textos(evento.mcp_servers),
    ferramentas: textos(evento.tools),
    origemDaChave: texto(evento.apiKeySource),
    problemas: [],
  }
  const p = init.problemas
  if (init.versao !== opcoes.suite.claude_code)
    p.push(`Claude Code ${init.versao ?? '?'}, esperado ${opcoes.suite.claude_code}`)
  if (init.modelo !== opcoes.modelo) p.push(`modelo ${init.modelo ?? '?'}, esperado ${opcoes.modelo}`)
  if (init.modo !== opcoes.suite.agente.modo) p.push(`modo ${init.modo ?? '?'}, esperado ${opcoes.suite.agente.modo}`)
  if (opcoes.esforco && init.esforco !== null && init.esforco !== opcoes.esforco) {
    p.push(`esforço ${init.esforco}, esperado ${opcoes.esforco}`)
  }
  for (const skill of opcoes.skillsEsperadas) {
    const comandos = textos(evento.slash_commands)
    if (!init.skills.includes(skill) && !comandos.includes(skill)) p.push(`a skill ${skill} não carregou`)
  }
  if (init.plugins.length) p.push(`plugins carregados: ${init.plugins.join(', ')}`)
  if (init.mcp.length) p.push(`servidores MCP carregados: ${init.mcp.join(', ')}`)
  return init
}

/** Ambiente do agente, por lista branca (plano, seção 4.3). */
export function ambienteDoAgente(ws: Workspace, token: string): Ambiente {
  return {
    ...ambienteBase(),
    TEMP: ws.tmp,
    TMP: ws.tmp,
    CLAUDE_CONFIG_DIR: ws.cfg,
    CLAUDE_CODE_OAUTH_TOKEN: token,
    ENABLE_CLAUDEAI_MCP_SERVERS: 'false',
    DISABLE_AUTOUPDATER: '1',
    GH_CONFIG_DIR: ws.gh,
    GIT_CONFIG_GLOBAL: ws.gitconfig,
  }
}

// Fim por limite do plano, sobrecarga ou erro da API: a tentativa "não rodou" e a rodada para.
const NAO_RODOU =
  /usage limit|limit reached|hit your limit|rate.?limit|overloaded|api error|authentication|invalid api key|oauth|credit balance|529|ECONNRESET|ENOTFOUND|ETIMEDOUT/i

export async function rodarAgente(opcoes: OpcoesDoAgente): Promise<ResultadoDoAgente> {
  const { suite, ws, log } = opcoes
  writeFileSync(path.join(ws.cfg, 'settings.json'), `${JSON.stringify({ language: suite.agente.idioma }, null, 2)}\n`)
  mkdirSync(path.dirname(opcoes.transcricao), { recursive: true })
  const args = ['-p', opcoes.pedido, '--model', opcoes.modelo]
  if (opcoes.esforco) args.push('--effort', opcoes.esforco)
  args.push(
    '--permission-mode',
    suite.agente.modo,
    '--permission-prompts',
    'none',
    '--strict-mcp-config',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-hook-events',
    '--max-budget-usd',
    String(opcoes.tetoUsd),
    '--no-session-persistence',
  )

  const job = await criarJob()
  const inicio = Date.now()
  const filho = spawn(localizarClaude(), args, {
    cwd: ws.repo,
    env: paraSpawn(ambienteDoAgente(ws, opcoes.token)),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  if (filho.pid !== undefined) await job.atribuir(filho.pid)
  log(`agente: claude -p no workspace ${ws.id} (pid ${filho.pid})`)

  const arquivo = createWriteStream(opcoes.transcricao)
  const eventos: Evento[] = []
  let stderr = ''
  let primeiroResult: number | null = null
  filho.stderr.setEncoding('utf8').on('data', (pedaco: string) => (stderr += pedaco))
  createInterface({ input: filho.stdout }).on('line', (linha) => {
    arquivo.write(`${linha}\n`)
    try {
      const evento = JSON.parse(linha) as Evento
      eventos.push(evento)
      if (evento.type === 'result' && primeiroResult === null) primeiroResult = Date.now()
    } catch {
      eventos.push({ type: 'texto-solto', texto: linha })
    }
  })
  let saiu = false
  const saida = new Promise<void>((resolve) =>
    filho.on('exit', () => {
      saiu = true
      resolve()
    }),
  )

  // Espera o processo sair, com tempo limite de parede. Depois do primeiro `result`, só a carência: no -p, uma tarefa
  // em segundo plano (o `pnpm start` do /verificar) segura o processo e ainda gera mais um turno.
  const limite = inicio + suite.tempo_limite_min * 60_000
  let esgotou = false
  while (!saiu) {
    const agora = Date.now()
    if (primeiroResult !== null && agora >= primeiroResult + suite.carencia_s * 1000) break
    if (agora >= limite) {
      esgotou = true
      break
    }
    await Promise.race([saida, esperar(1000)])
  }
  const saiuSozinho = saiu

  // Porta ainda em escuta depois da carência: se o dono nasceu na tentativa (está no job), é servidor esquecido;
  // se não, outro processo ocupou a porta durante a rodada, e a rodada para.
  const noJob = new Set(await job.pids())
  const servidorEsquecido: Escuta[] = []
  const portasDeFora: Escuta[] = []
  for (const escuta of portasEmEscuta()) {
    if (!naFaixa(escuta.porta, suite.portas.agente) && escuta.porta !== suite.portas.avaliador) continue
    if (noJob.has(escuta.pid)) servidorEsquecido.push(escuta)
    else portasDeFora.push(escuta)
  }
  await job.encerrar()
  await Promise.race([saida, esperar(10_000)])
  await new Promise<void>((resolve) => arquivo.end(() => resolve()))
  const duracaoS = Math.round((Date.now() - inicio) / 1000)

  const results = eventos.filter((e) => e.type === 'result')
  const ultimo = results.at(-1)
  const custoUsd = results.reduce((maior, e) => Math.max(maior, Number(e.total_cost_usd ?? 0)), 0)
  const evInit = eventos.find((e) => e.type === 'system' && e.subtype === 'init')
  const init = evInit ? conferirInit(evInit, opcoes) : null
  const principal = new Set<string>()
  const subagentes = new Set<string>()
  for (const e of eventos) {
    if (e.type !== 'assistant') continue
    const modelo = texto((e.message as { model?: unknown } | undefined)?.model)
    if (!modelo) continue
    if (e.parent_tool_use_id) subagentes.add(modelo)
    else principal.add(modelo)
  }

  let status: StatusDoAgente = 'ok'
  let fim = texto(ultimo?.subtype) ?? (esgotou ? 'tempo-esgotado' : 'sem-result')
  const textoDoFim = `${texto(ultimo?.result) ?? ''}\n${stderr}`
  const tentouDeNovo = eventos.some((e) => e.type === 'system' && e.subtype === 'api_retry')
  if (results.some((e) => e.subtype === 'error_max_budget_usd')) {
    status = 'corte'
    fim = 'error_max_budget_usd'
  } else if (!ultimo && esgotou) {
    status = 'tempo-esgotado'
  } else if (!ultimo || (ultimo.is_error === true && (NAO_RODOU.test(textoDoFim) || tentouDeNovo))) {
    status = 'nao-rodou'
    if (!ultimo) fim = NAO_RODOU.test(stderr) ? 'erro-de-api' : 'sem-result'
  }
  return {
    status,
    fim,
    custoUsd,
    turnos: typeof ultimo?.num_turns === 'number' ? ultimo.num_turns : null,
    duracaoS,
    init,
    modelos: { principal: [...principal], subagentes: [...subagentes] },
    servidorEsquecido,
    portasDeFora,
    saiuSozinho,
    eventos,
    stderr: stderr.slice(-4000),
  }
}
