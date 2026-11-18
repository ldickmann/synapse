// O que o runner e os avaliadores dividem: caminhos, tipos da suíte e dos casos, processos, ambiente e escrita
// formatada. Roda com `node` direto, sem compilar, como os scripts de scripts/: só sintaxe que o Node consegue
// apagar (erasableSyntaxOnly), e import de tipo sempre com `import type`.
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as prettier from 'prettier'

export const RAIZ = path.resolve(import.meta.dirname, '..', '..')
export const EVALS = path.join(RAIZ, 'evals')
// Fora do repositório: o modelo de config do agente, as transcrições, os rótulos e o que o juiz usa.
export const LOCAL = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'synapse-evals')
// Na transcrição e nos relatórios o caminho de LOCAL aparece assim, sem o nome do usuário do Windows.
export const LOCAL_ROTULO = '%LOCALAPPDATA%\\synapse-evals'
// Variável de ambiente do usuário com o token de `claude setup-token`. O runner a passa ao agente e ao juiz como
// CLAUDE_CODE_OAUTH_TOKEN, para o token das evals não valer nas sessões normais do Lucas.
export const VARIAVEL_DO_TOKEN = 'SYNAPSE_EVALS_OAUTH_TOKEN'

/** Ambiente de um processo filho. O tipo do Node exige NODE_ENV (o Next acrescenta), e o runner monta o seu do zero. */
export type Ambiente = Record<string, string | undefined>

/** O ambiente no formato que o spawn aceita. */
export function paraSpawn(env: Ambiente | undefined): NodeJS.ProcessEnv {
  return (env ?? process.env) as NodeJS.ProcessEnv
}

export type Suite = {
  base: { tag: string; commit: string }
  claude_code: string
  agente: { modelo: string; esforco: string; modo: string; idioma: string }
  juiz: { modelo: string; votos: number; teto_chamada_usd: number }
  tentativas: number
  teto_tentativa_usd: number
  orcamento_rodada_usd: number
  estimativa_juiz_tentativa_usd: number
  tempo_limite_min: number
  carencia_s: number
  portas: { agente: [number, number][]; avaliador: number }
  raiz_workspaces: string
  commit_do_harness: { mensagem: string; nome: string; email: string; data: string }
  regua: string[]
}

export type Conjunto = 'ajuste' | 'validacao'
export type TipoDeCaso = 'deve' | 'nao-deve' | 'regressao'

export type Checagem =
  | { tipo: 'valor-igual'; arquivo: string; nome: string }
  | { tipo: 'valor-igual-ao-base'; arquivo: string; nome: string }
  | { tipo: 'linha-da-tabela-ausente'; arquivo: string; secao: string; primeira_celula: string }
  | { tipo: 'removida-no-mesmo-commit'; arquivo: string; secao: string; primeira_celula: string; junto_com: string }

export type PedidoCumprido =
  | { tipo: 'codigo'; verificacoes: string[]; valor_esperado?: string; checagens: Checagem[] }
  | { tipo: 'juiz'; criterio: string }

export type ComentarioVigiado = {
  arquivo: string
  linha: number
  texto: string
  passa: string
  termos_proibidos?: { regex: string; flags: string }
}

export type Caso = {
  id: string
  comportamento: string
  conjunto: Conjunto
  tipo: TipoDeCaso
  origem: Record<string, unknown>
  arquivos_esperados: string[]
  arquivos_permitidos: string[]
  avaliadores: string[]
  comentario_vigiado?: ComentarioVigiado
  pedido_cumprido: PedidoCumprido
  criterio: string
  teto_usd: number
  /** Pasta do caso (casos/<id> ou validacao/<id>). */
  pasta: string
  /** O texto de pedido.md, como vai para o `claude -p`. */
  pedido: string
}

export function lerJson<T>(arquivo: string): T {
  return JSON.parse(readFileSync(arquivo, 'utf8')) as T
}

export function lerSuite(): Suite {
  return lerJson<Suite>(path.join(EVALS, 'suite.json'))
}

/** Os casos de `casos/` (ajuste) e de `validacao/`, em ordem de id. */
export function lerCasos(): Caso[] {
  const casos: Caso[] = []
  for (const sub of ['casos', 'validacao']) {
    const pasta = path.join(EVALS, sub)
    if (!existsSync(pasta)) continue
    for (const id of readdirSync(pasta).sort()) {
      const arquivo = path.join(pasta, id, 'caso.json')
      if (!existsSync(arquivo)) continue
      const caso = lerJson<Omit<Caso, 'pasta' | 'pedido'>>(arquivo)
      const pedido = readFileSync(path.join(pasta, id, 'pedido.md'), 'utf8').trim()
      casos.push({ ...caso, pasta: path.join(pasta, id), pedido })
    }
  }
  return casos
}

export type Saida = { status: number; saida: string; erro: string; duracaoMs: number; esgotou: boolean }

export type OpcoesDeProcesso = {
  cwd: string
  env: Ambiente
  /** Texto escrito na entrada padrão, que depois fecha. Sem ele, a entrada é vazia. */
  entrada?: string
  tempoMs?: number
  /** Chamado com o PID logo depois do spawn, para pôr o processo num Job Object. */
  aoIniciar?: (pid: number) => Promise<void> | void
}

/**
 * Roda um executável sem shell e junta a saída. Passado o tempo, mata o processo e marca `esgotou`; quem pôs o
 * processo num Job Object encerra o job para levar junto o que ele abriu.
 */
export function executar(programa: string, args: string[], opcoes: OpcoesDeProcesso): Promise<Saida> {
  return iniciar(programa, args, false, opcoes)
}

/** Aspas para um argumento na linha do cmd.exe (o pnpm é um .cmd e só roda por um shell). */
function citarParaCmd(arg: string): string {
  return /^[\w@%+=:,./\\-]+$/.test(arg) ? arg : `"${arg.replaceAll('"', '""')}"`
}

/** Roda o pnpm pelo cmd.exe, com a linha inteira já citada: passar `args` junto com `shell: true` é obsoleto. */
export function executarPnpm(args: string[], opcoes: OpcoesDeProcesso): Promise<Saida> {
  return iniciar(['pnpm', ...args.map(citarParaCmd)].join(' '), [], true, opcoes)
}

function iniciar(programa: string, args: string[], shell: boolean, opcoes: OpcoesDeProcesso): Promise<Saida> {
  const inicio = Date.now()
  return new Promise((resolve) => {
    const filho = spawn(programa, args, {
      cwd: opcoes.cwd,
      env: paraSpawn(opcoes.env),
      shell,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let saida = ''
    let erro = ''
    let esgotou = false
    filho.stdout.setEncoding('utf8').on('data', (pedaco: string) => (saida += pedaco))
    filho.stderr.setEncoding('utf8').on('data', (pedaco: string) => (erro += pedaco))
    filho.stdin.on('error', () => undefined)
    if (opcoes.entrada !== undefined) filho.stdin.end(opcoes.entrada)
    else filho.stdin.end()
    const relogio = opcoes.tempoMs
      ? setTimeout(() => {
          esgotou = true
          filho.kill()
        }, opcoes.tempoMs)
      : null
    if (filho.pid !== undefined && opcoes.aoIniciar) void opcoes.aoIniciar(filho.pid)
    filho.on('error', (e) => {
      if (relogio) clearTimeout(relogio)
      resolve({ status: 1, saida, erro: `${erro}${String(e)}`, duracaoMs: Date.now() - inicio, esgotou })
    })
    filho.on('close', (status) => {
      if (relogio) clearTimeout(relogio)
      resolve({ status: status ?? 1, saida, erro, duracaoMs: Date.now() - inicio, esgotou })
    })
  })
}

export type Git = { status: number; saida: string; erro: string }

/** Git síncrono, sem shell. A saída vem sem o espaço do fim; o limite cabe um diff grande. */
export function git(args: string[], cwd: string, env?: Ambiente): Git {
  const r = spawnSync('git', args, {
    cwd,
    env: paraSpawn(env),
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 512 * 1024 * 1024,
  })
  return { status: r.status ?? 1, saida: (r.stdout ?? '').trimEnd(), erro: (r.stderr ?? '').trim() }
}

/** A saída do git como veio, sem cortar o fim: para ler o conteúdo de um arquivo byte a byte. */
export function gitBruto(args: string[], cwd: string, env?: Ambiente): { status: number; saida: string } {
  const r = spawnSync('git', args, { cwd, env: paraSpawn(env), windowsHide: true, maxBuffer: 512 * 1024 * 1024 })
  return { status: r.status ?? 1, saida: (r.stdout ?? Buffer.alloc(0)).toString('utf8') }
}

/** O conteúdo de um blob em bytes, para copiar um arquivo sem mudar nada nele. */
export function gitBlob(blob: string, cwd: string, env?: Ambiente): Buffer {
  const r = spawnSync('git', ['cat-file', 'blob', blob], {
    cwd,
    env: paraSpawn(env),
    windowsHide: true,
    maxBuffer: 512 * 1024 * 1024,
  })
  if (r.status !== 0) throw new Error(`git cat-file blob ${blob} saiu com ${r.status}`)
  return r.stdout
}

/** Git que precisa dar certo: com saída diferente de 0, lança o erro com o comando. */
export function gitOk(args: string[], cwd: string, env?: Ambiente): string {
  const r = git(args, cwd, env)
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} saiu com ${r.status}: ${r.erro || r.saida}`)
  return r.saida
}

// Variáveis do Windows que um processo aberto pelo Explorer tem. O resto do ambiente desta sessão (as do VS Code,
// as do Claude Code que dispara o runner, HUSKY, CI, PORT, PORTA, CF_PAGES_BRANCH, ANTHROPIC_API_KEY) fica de fora.
const MANTIDAS = [
  'ALLUSERSPROFILE',
  'APPDATA',
  'CommonProgramFiles',
  'CommonProgramFiles(x86)',
  'CommonProgramW6432',
  'COMPUTERNAME',
  'ComSpec',
  'COREPACK_ENABLE_AUTO_PIN',
  'DriverData',
  'HOMEDRIVE',
  'HOMEPATH',
  'LOCALAPPDATA',
  'LOGONSERVER',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'PATHEXT',
  'PNPM_HOME',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_IDENTIFIER',
  'PROCESSOR_LEVEL',
  'PROCESSOR_REVISION',
  'ProgramData',
  'ProgramFiles',
  'ProgramFiles(x86)',
  'ProgramW6432',
  'PUBLIC',
  'SystemDrive',
  'SystemRoot',
  'USERDOMAIN',
  'USERDOMAIN_ROAMINGPROFILE',
  'USERNAME',
  'USERPROFILE',
  'windir',
]

type Registro = { Path: string; PSModulePath: string; token: string }
let registro: Registro | null = null

/**
 * Path e PSModulePath como o Windows monta para um processo novo (máquina e usuário, do registro), e o token das
 * evals. O ambiente desta sessão não serve: o Git Bash põe as pastas dele na frente do PATH, e a variável que o
 * Lucas cria depois de o VS Code abrir só existe no registro.
 */
function lerRegistro(): Registro {
  if (registro) return registro
  const script = [
    "$m = [Environment]::GetEnvironmentVariable('Path','Machine')",
    "$u = [Environment]::GetEnvironmentVariable('Path','User')",
    "$pm = [Environment]::GetEnvironmentVariable('PSModulePath','Machine')",
    "$pu = [Environment]::GetEnvironmentVariable('PSModulePath','User')",
    `$t = [Environment]::GetEnvironmentVariable('${VARIAVEL_DO_TOKEN}','User')`,
    "[Console]::Out.Write((@{ Path = (@($m, $u) | Where-Object { $_ }) -join ';'; PSModulePath = (@($pm, $pu) | Where-Object { $_ }) -join ';'; token = [string]$t } | ConvertTo-Json -Compress))",
  ].join('; ')
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
  })
  if (r.status !== 0) throw new Error(`Não deu para ler o registro: ${r.stderr}`)
  registro = JSON.parse(r.stdout) as Registro
  return registro
}

/** O ambiente de partida de todo processo que o runner abre, montado por lista branca. */
export function ambienteBase(): Ambiente {
  const env: Ambiente = {}
  for (const nome of MANTIDAS) if (process.env[nome] !== undefined) env[nome] = process.env[nome]
  const reg = lerRegistro()
  env.Path = reg.Path
  if (reg.PSModulePath) env.PSModulePath = reg.PSModulePath
  return env
}

/** O token das evals: da variável do processo ou, se ela não existe aqui, da variável do usuário no registro. */
export function lerToken(): string | null {
  const token = process.env[VARIAVEL_DO_TOKEN] || lerRegistro().token
  return token ? token.trim() : null
}

export type Escuta = { porta: number; pid: number }

/** Portas TCP em escuta, em IPv4 e IPv6, com o PID do dono (netstat responde mais rápido que o Get-NetTCPConnection). */
export function portasEmEscuta(): Escuta[] {
  const r = spawnSync('netstat', ['-ano'], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 })
  const lista: Escuta[] = []
  for (const linha of (r.stdout ?? '').split(/\r?\n/)) {
    const m = linha.trim().match(/^TCP\s+(\S+):(\d+)\s+\S+\s+LISTENING\s+(\d+)$/)
    if (m) lista.push({ porta: Number(m[2]), pid: Number(m[3]) })
  }
  return lista
}

export function naFaixa(porta: number, faixas: [number, number][]): boolean {
  return faixas.some(([de, ate]) => porta >= de && porta <= ate)
}

/** Data local no formato AAAA-MM-DD, a do nome da pasta de um experimento. */
export function dataLocal(quando = new Date()): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${quando.getFullYear()}-${dois(quando.getMonth() + 1)}-${dois(quando.getDate())}`
}

export function sha256(texto: string | Buffer): string {
  return createHash('sha256').update(texto).digest('hex')
}

export function colapsarEspacos(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/** Escreve o arquivo já formatado pelo Prettier do projeto, para o `pnpm formatar:checar` passar com ele. */
export async function escreverFormatado(arquivo: string, conteudo: string): Promise<void> {
  const config = (await prettier.resolveConfig(arquivo)) ?? {}
  const texto = await prettier.format(conteudo, { ...config, filepath: arquivo })
  mkdirSync(path.dirname(arquivo), { recursive: true })
  writeFileSync(arquivo, texto)
}

export async function escreverJson(arquivo: string, dado: unknown): Promise<void> {
  await escreverFormatado(arquivo, JSON.stringify(dado, null, 2))
}

/** Caminho em LOCAL como aparece nos relatórios: com %LOCALAPPDATA% no lugar da pasta do usuário. */
export function rotuloLocal(caminho: string): string {
  const relativo = path.relative(LOCAL, caminho)
  return relativo.startsWith('..') ? caminho : `${LOCAL_ROTULO}\\${relativo}`
}

/** As últimas `n` linhas de um texto, para a evidência caber no relatório. */
export function ultimasLinhas(texto: string, n: number): string {
  const linhas = texto.replace(/\r\n/g, '\n').trimEnd().split('\n')
  return (linhas.length > n ? ['…', ...linhas.slice(-n)] : linhas).join('\n')
}

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Lê os argumentos `--nome valor` e `--sinal` da linha de comando. */
export function lerArgumentos(argv: string[]): { opcoes: Map<string, string | true>; posicionais: string[] } {
  const opcoes = new Map<string, string | true>()
  const posicionais: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      posicionais.push(arg)
      continue
    }
    const igual = arg.indexOf('=')
    if (igual !== -1) opcoes.set(arg.slice(2, igual), arg.slice(igual + 1))
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opcoes.set(arg.slice(2), argv[++i])
    else opcoes.set(arg.slice(2), true)
  }
  return { opcoes, posicionais }
}
