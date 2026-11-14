// PreToolUse (Edit|Write): nega edição dos arquivos que só uma ferramenta escreve e dos .env com segredo.
import path from 'node:path'
import { lerEntrada, negar, relativoARaiz } from './comum.mjs'

const GERADOS = {
  'pnpm-lock.yaml': 'O pnpm escreve o lockfile: use pnpm add, pnpm remove ou pnpm update.',
  'CHANGELOG.md': 'O release-please escreve o CHANGELOG a partir dos commits.',
  '.release-please-manifest.json': 'O release-please atualiza o manifesto a cada versão.',
}

function motivo(relativo) {
  const nome = path.posix.basename(relativo)
  if (GERADOS[nome]) return `${relativo} não se edita à mão. ${GERADOS[nome]}`
  if (/^\.env/.test(nome) && nome !== '.env.example') {
    return `${relativo} guarda valores locais e fica fora do alcance do Claude. Variável nova entra no .env.example, com o comentário.`
  }
  return null
}

const entrada = await lerEntrada()
const relativo = relativoARaiz(entrada.tool_input?.file_path)
const razao = relativo && motivo(relativo)
if (razao) negar(razao)
