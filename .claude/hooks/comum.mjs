// Funções dos hooks do Claude Code deste repositório (.claude/settings.json). Sem dependências.
import { spawnSync } from 'node:child_process'
import path from 'node:path'

/** Raiz do repositório: os scripts ficam em .claude/hooks/. */
export const RAIZ = path.resolve(import.meta.dirname, '..', '..')

/** Lê o JSON que o Claude Code manda pela entrada padrão. Entrada vazia ou inválida vira {}. */
export async function lerEntrada() {
  let texto = ''
  for await (const pedaco of process.stdin) texto += pedaco
  try {
    return JSON.parse(texto)
  } catch {
    return {}
  }
}

/** Roda o git sem shell e devolve { status, saida }. */
export function git(args, cwd = RAIZ) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
  return { status: r.status ?? 1, saida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() }
}

/** Aspas para um argumento na linha de comando do shell (cmd.exe no Windows, sh nos outros). */
function citar(arg) {
  if (/^[\w@%+=:,./\\-]+$/.test(arg)) return arg
  return process.platform === 'win32' ? `"${arg}"` : `'${arg.replaceAll("'", `'\\''`)}'`
}

/**
 * Roda o pnpm e devolve { status, saida }. No Windows o pnpm é um .cmd, que só roda por um shell; a linha vai
 * inteira, já com as aspas, porque passar `args` junto com `shell: true` é obsoleto desde o Node 24.
 */
export function pnpm(args) {
  const linha = ['pnpm', ...args.map(citar)].join(' ')
  // Sem cor: a saída volta para o Claude como texto.
  const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' }
  const r = spawnSync(linha, { cwd: RAIZ, encoding: 'utf8', shell: true, windowsHide: true, env })
  return { status: r.status ?? 1, saida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() }
}

/** Responde a um PreToolUse negando a ferramenta, com o motivo que volta para o Claude. */
export function negar(motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
    }),
  )
}

/** Caminho relativo à raiz, com barras normais, ou null se o arquivo está fora do repositório. */
export function relativoARaiz(arquivo) {
  if (typeof arquivo !== 'string' || arquivo === '') return null
  const relativo = path.relative(RAIZ, path.resolve(RAIZ, arquivo))
  if (relativo === '' || relativo.startsWith('..') || path.isAbsolute(relativo)) return null
  return relativo.split(path.sep).join('/')
}

/** As últimas `n` linhas de um texto. */
export function ultimasLinhas(texto, n) {
  const linhas = texto.split(/\r?\n/)
  return linhas.length > n ? ['…', ...linhas.slice(-n)].join('\n') : texto
}
