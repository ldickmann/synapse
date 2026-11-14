// PostToolUse (Edit|Write): formata com o Prettier o arquivo que o Claude acabou de editar. Arquivo ignorado
// (.prettierignore e .gitignore) ou de tipo que o Prettier não conhece fica como está. Se o Prettier não
// consegue ler o arquivo (erro de sintaxe), o erro volta para o Claude com exit 2.
// O CLI do Prettier do projeto roda pelo próprio Node, sem shell e sem pnpm: as mesmas regras do `pnpm formatar`,
// em menos tempo a cada edição.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { lerEntrada, RAIZ, relativoARaiz, ultimasLinhas } from './comum.mjs'

const entrada = await lerEntrada()
const relativo = relativoARaiz(entrada.tool_input?.file_path)
if (relativo && existsSync(path.join(RAIZ, relativo))) {
  let cli
  try {
    cli = createRequire(path.join(RAIZ, 'package.json')).resolve('prettier/bin/prettier.cjs')
  } catch {
    process.stderr.write('O Prettier do projeto não foi encontrado. Rode pnpm install.\n')
    process.exit(1)
  }
  const r = spawnSync(process.execPath, [cli, '--write', '--ignore-unknown', '--log-level', 'warn', relativo], {
    cwd: RAIZ,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  if (r.status !== 0) {
    const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() || String(r.error ?? '')
    process.stderr.write(`O Prettier não formatou ${relativo}:\n${ultimasLinhas(saida, 20)}\n`)
    process.exit(2)
  }
}
