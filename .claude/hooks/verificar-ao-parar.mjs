// Stop: se app/, componentes/, lib/, tests/ ou scripts/ têm mudança fora de commit (arquivo novo incluído), roda
// typecheck e lint em paralelo. A falha volta para o Claude com exit 2, e ele continua para corrigir.
// Duas travas:
// - Parada que já é continuação de um Stop (stop_hook_active) sai com 0. Sem isso, uma falha que o Claude não
//   consegue corrigir (erro antigo, arquivo editado fora da sessão, dependência quebrada) prende a sessão num laço.
// - O hash do HEAD, do `git diff` e dos arquivos novos dessas pastas fica em .git/, fora da árvore, a cada
//   verificação que passa. Se nada mudou desde então, a verificação não roda de novo.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { git, lerEntrada, pnpm, RAIZ, ultimasLinhas } from './comum.mjs'

const PASTAS = ['app', 'componentes', 'lib', 'tests', 'scripts']

/** Hash do estado dessas pastas, ou null se não há mudança nelas (ou se o git não respondeu). */
function hashDasMudancas() {
  const status = git(['status', '--porcelain', '--', ...PASTAS])
  if (status.status !== 0 || status.saida === '') return null
  const hash = createHash('sha256')
  hash.update(git(['rev-parse', 'HEAD']).saida)
  hash.update(git(['diff', 'HEAD', '--binary', '--', ...PASTAS]).saida)
  const novos = git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...PASTAS]).saida.split('\0')
  for (const arquivo of novos.filter(Boolean).sort()) {
    hash.update(`\0${arquivo}\0`)
    try {
      hash.update(readFileSync(path.join(RAIZ, arquivo)))
    } catch {
      // Apagado entre o ls-files e a leitura: o nome já entrou no hash.
    }
  }
  return hash.digest('hex')
}

/** Arquivo, dentro de .git/ (ou do .git do worktree), com o hash da última verificação que passou. */
function arquivoDaMarca() {
  const r = git(['rev-parse', '--git-path', 'claude-verificar-ao-parar'])
  return r.status === 0 && r.saida ? path.resolve(RAIZ, r.saida) : null
}

function lerMarca(arquivo) {
  try {
    return readFileSync(arquivo, 'utf8').trim()
  } catch {
    return null
  }
}

const entrada = await lerEntrada()
if (entrada.stop_hook_active === true) process.exit(0)

const hash = hashDasMudancas()
if (!hash) process.exit(0)
const marca = arquivoDaMarca()
if (marca && lerMarca(marca) === hash) process.exit(0)

const resultados = await Promise.all(
  ['typecheck', 'lint'].map(async (script) => ({ script, ...(await pnpm([script])) })),
)
const falhas = resultados.filter((r) => r.status !== 0)
if (falhas.length) {
  const detalhes = falhas.map((r) => `pnpm ${r.script} falhou:\n${ultimasLinhas(r.saida, 40)}`)
  process.stderr.write(
    `Há mudança em ${PASTAS.join('/, ')}/ e a verificação não passou. Corrija e rode de novo o comando que falhou: a próxima parada não passa por esta verificação.\n\n${detalhes.join('\n\n')}\n`,
  )
  process.exit(2)
}
if (marca) {
  try {
    writeFileSync(marca, `${hash}\n`)
  } catch {
    // Sem a marca, a próxima parada só verifica de novo.
  }
}
