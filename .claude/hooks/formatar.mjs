// PostToolUse (Edit|Write): formata com o Prettier o arquivo que o Claude acabou de editar. Arquivo ignorado
// (.prettierignore e .gitignore) ou de tipo que o Prettier não conhece fica como está. Se o Prettier não
// consegue ler o arquivo (erro de sintaxe), o erro volta para o Claude com exit 2.
import { existsSync } from 'node:fs'
import path from 'node:path'
import { lerEntrada, pnpm, RAIZ, relativoARaiz, ultimasLinhas } from './comum.mjs'

const entrada = await lerEntrada()
const relativo = relativoARaiz(entrada.tool_input?.file_path)
if (relativo && existsSync(path.join(RAIZ, relativo))) {
  const r = pnpm(['exec', 'prettier', '--write', '--ignore-unknown', '--log-level', 'warn', relativo])
  if (r.status !== 0) {
    process.stderr.write(`O Prettier não formatou ${relativo}:\n${ultimasLinhas(r.saida, 20)}\n`)
    process.exit(2)
  }
}
