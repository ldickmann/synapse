// checagens-do-site: lint, formatação, tipos, padrões, build e os 13 testes do Playwright numa cópia do estado final,
// com a régua do base restaurada (suite.json, `regua`) e numa porta própria. Assim a tentativa não passa mexendo na
// régua, como na F6 do plano, em que uma exceção no checar-padroes fez a checagem passar.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  ambienteBase,
  esperar,
  executarPnpm,
  gitBlob,
  gitOk,
  portasEmEscuta,
  sha256,
  ultimasLinhas,
  type Ambiente,
  type Saida,
} from '../runner/comum.ts'
import { criarJob } from '../runner/job.ts'
import type { Avaliador, Contexto, ResultadoDoAvaliador } from './contexto.ts'

type Passo = { nome: string; args: string[]; tempoMs: number }

const PASSOS: Passo[] = [
  { nome: 'install', args: ['install', '--frozen-lockfile', '--prefer-offline'], tempoMs: 10 * 60_000 },
  { nome: 'lint', args: ['lint'], tempoMs: 10 * 60_000 },
  { nome: 'formatacao', args: ['formatar:checar'], tempoMs: 5 * 60_000 },
  { nome: 'tipos', args: ['typecheck'], tempoMs: 10 * 60_000 },
  { nome: 'padroes', args: ['verificar:padroes'], tempoMs: 2 * 60_000 },
  { nome: 'build', args: ['build'], tempoMs: 15 * 60_000 },
  { nome: 'testes', args: ['verificar:testes'], tempoMs: 15 * 60_000 },
]

// O build baixa as fontes do Google (next/font/google): sem rede, a falha não é da tentativa.
const FALHA_DE_REDE =
  /Failed to fetch[\s\S]{0,200}Google Fonts|fonts\.(googleapis|gstatic)\.com[\s\S]{0,200}(ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN)/i

type ResultadoDoPasso = { nome: string; status: number | 'nao-rodou'; duracaoS: number; evidencia: string }

/** Arquivos da régua no início, por caminho, com o blob de cada um. */
function reguaDoInicio(ctx: Contexto): Map<string, string> {
  const arquivos = new Map<string, string>()
  const saida = gitOk(['ls-tree', '-r', ctx.inicio, '--', ...ctx.suite.regua], ctx.ws.repo, ctx.env)
  for (const linha of saida.split('\n').filter(Boolean)) {
    const [info, caminho] = linha.split('\t')
    arquivos.set(caminho, info.split(' ')[2])
  }
  return arquivos
}

/** Monta a cópia: o estado final por um índice temporário e, por cima, a régua do início. */
function montarCopia(ctx: Contexto, pasta: string, regua: Map<string, string>): string[] {
  rmSync(pasta, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
  mkdirSync(pasta, { recursive: true })
  const indice = path.join(ctx.ws.pasta, 'indice-copia')
  rmSync(indice, { force: true })
  const env = { ...ctx.env, GIT_INDEX_FILE: indice }
  gitOk(['read-tree', ctx.final], ctx.ws.repo, env)
  gitOk(['--work-tree', pasta, 'checkout-index', '--all', '--force'], ctx.ws.repo, env)
  rmSync(indice, { force: true })

  // O que a tentativa mudou na régua, para o relatório; a cópia volta ao início de qualquer jeito.
  const finalDaRegua = new Map<string, string>()
  const saida = gitOk(['ls-tree', '-r', ctx.final, '--', ...ctx.suite.regua], ctx.ws.repo, ctx.env)
  for (const linha of saida.split('\n').filter(Boolean)) {
    const [info, caminho] = linha.split('\t')
    finalDaRegua.set(caminho, info.split(' ')[2])
  }
  const mudados = [...new Set([...regua.keys(), ...finalDaRegua.keys()])].filter(
    (c) => regua.get(c) !== finalDaRegua.get(c),
  )
  for (const item of ctx.suite.regua) rmSync(path.join(pasta, item), { recursive: true, force: true })
  for (const [caminho, blob] of regua) {
    const destino = path.join(pasta, caminho)
    mkdirSync(path.dirname(destino), { recursive: true })
    writeFileSync(destino, gitBlob(blob, ctx.ws.repo, ctx.env))
  }
  return mudados.sort()
}

async function rodarPasso(ctx: Contexto, passo: Passo, pasta: string, env: Ambiente): Promise<Saida> {
  const job = await criarJob()
  try {
    return await executarPnpm(passo.args, {
      cwd: pasta,
      env,
      tempoMs: passo.tempoMs,
      aoIniciar: (pid) => job.atribuir(pid).catch(() => undefined),
    })
  } finally {
    await job.encerrar()
  }
}

/** A linha que resume a saída de um passo (o "13 passed", a contagem de violações), ou as últimas linhas. */
function evidencia(passo: string, saida: Saida): string {
  const texto = `${saida.saida}\n${saida.erro}`
  if (saida.esgotou) return `tempo esgotado depois de ${Math.round(saida.duracaoMs / 1000)} s`
  if (passo === 'testes') {
    const resumo = texto.match(/^\s*\d+ (passed|failed|flaky|skipped).*$/gm)
    if (resumo && saida.status === 0) return resumo.map((l) => l.trim()).join('; ')
  }
  if (passo === 'padroes' && saida.status === 0) return texto.match(/G21, G22 e G26: .*/)?.[0] ?? 'sem violação'
  if (saida.status === 0) return 'saída 0'
  return ultimasLinhas(texto, 25)
}

export const checagensDoSite: Avaliador = {
  nome: 'checagens-do-site',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const regua = reguaDoInicio(ctx)
    const chave = sha256(`${ctx.final}\n${[...regua].map(([c, b]) => `${c} ${b}`).join('\n')}`)
    const guardado = ctx.cache.get(chave)
    if (guardado) {
      return { ...guardado, resumo: `${guardado.resumo} (mesmo estado avaliado antes nesta rodada)` }
    }
    const porta = ctx.suite.portas.avaliador
    if (portasEmEscuta().some((e) => e.porta === porta)) {
      return { status: 'nao-rodou', resumo: `a porta ${porta} do avaliador está ocupada` }
    }
    const pasta = path.join(ctx.ws.pasta, 'av')
    const reguaMudada = montarCopia(ctx, pasta, regua)
    const tmp = path.join(ctx.ws.pasta, 'tmp-av')
    mkdirSync(tmp, { recursive: true })
    // HUSKY=0: a cópia não é um repositório, e o `prepare` só ligaria um hook que ninguém usa aqui.
    const env = { ...ambienteBase(), PORTA: String(porta), HUSKY: '0', TEMP: tmp, TMP: tmp }

    const passos: ResultadoDoPasso[] = []
    for (const passo of PASSOS) {
      const depende = passo.nome === 'testes' ? 'build' : 'install'
      const anterior = passos.find((p) => p.nome === depende)
      if (passo.nome !== 'install' && anterior && anterior.status !== 0) {
        passos.push({ nome: passo.nome, status: 'nao-rodou', duracaoS: 0, evidencia: `depende de ${depende}` })
        continue
      }
      ctx.log(`checagens-do-site: pnpm ${passo.args.join(' ')}`)
      let saida = await rodarPasso(ctx, passo, pasta, env)
      for (let repeticao = 1; passo.nome === 'build' && saida.status !== 0 && repeticao <= 2; repeticao++) {
        if (!FALHA_DE_REDE.test(`${saida.saida}\n${saida.erro}`)) break
        ctx.log('checagens-do-site: o build falhou ao baixar as fontes; repito em 30 s')
        await esperar(30_000)
        saida = await rodarPasso(ctx, passo, pasta, env)
      }
      if (passo.nome === 'build' && saida.status !== 0 && FALHA_DE_REDE.test(`${saida.saida}\n${saida.erro}`)) {
        return {
          status: 'nao-rodou',
          resumo: 'o build não baixou as fontes do Google depois de 3 tentativas (rede)',
          detalhes: { passos, reguaMudada },
        }
      }
      passos.push({
        nome: passo.nome,
        status: saida.status,
        duracaoS: Math.round(saida.duracaoMs / 1000),
        evidencia: evidencia(passo.nome, saida),
      })
    }
    const sobrou = portasEmEscuta().filter((e) => e.porta === porta)
    const falhas = passos.filter((p) => p.status !== 0)
    const resultado: ResultadoDoAvaliador = {
      status: falhas.length ? 'falha' : 'passa',
      resumo: falhas.length
        ? `falhou: ${falhas.map((p) => p.nome).join(', ')}`
        : `os 7 passos passaram (${passos.find((p) => p.nome === 'testes')?.evidencia ?? ''})`,
      detalhes: { passos, reguaMudada, portaOcupadaDepois: sobrou },
    }
    ctx.cache.set(chave, resultado)
    rmSync(pasta, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
    return resultado
  },
}
