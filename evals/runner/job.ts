// Ponte para o job.ps1: um Job Object por tentativa (e por avaliação), que mata a árvore de processos de uma vez.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { createInterface } from 'node:readline'

export type Job = {
  atribuir(pid: number): Promise<void>
  pids(): Promise<number[]>
  encerrar(): Promise<void>
}

const SCRIPT = path.join(import.meta.dirname, 'job.ps1')
const TEMPO_DE_RESPOSTA_MS = 30_000

/** Abre o job.ps1 e espera o job existir. Se o runner morrer, a entrada do job.ps1 fecha e o job encerra. */
export async function criarJob(): Promise<Job> {
  const ajudante = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true },
  )
  let erro = ''
  ajudante.stderr.setEncoding('utf8').on('data', (pedaco: string) => (erro += pedaco))
  const fila: ((linha: string) => void)[] = []
  createInterface({ input: ajudante.stdout }).on('line', (linha) => fila.shift()?.(linha))
  let encerrado = false
  const fechou = new Promise<void>((resolve) => ajudante.on('close', () => resolve()))

  function pedir(comando: string | null): Promise<string> {
    return new Promise((resolve, reject) => {
      const relogio = setTimeout(
        () => reject(new Error(`job.ps1 não respondeu a "${comando ?? 'início'}". ${erro}`)),
        TEMPO_DE_RESPOSTA_MS,
      )
      fila.push((linha) => {
        clearTimeout(relogio)
        if (linha.startsWith('erro')) reject(new Error(`job.ps1: ${linha}`))
        else resolve(linha)
      })
      if (comando !== null) ajudante.stdin.write(`${comando}\n`)
    })
  }

  await pedir(null)
  return {
    async atribuir(pid) {
      await pedir(`atribuir ${pid}`)
    },
    async pids() {
      const linha = await pedir('pids')
      return linha
        .replace(/^pids\s*/, '')
        .split(',')
        .filter(Boolean)
        .map(Number)
    },
    async encerrar() {
      if (encerrado) return
      encerrado = true
      ajudante.stdin.end('encerrar\n')
      await fechou
    },
  }
}
