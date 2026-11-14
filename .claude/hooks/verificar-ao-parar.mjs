// Stop: se o git status mostra mudança em app/, componentes/, lib/, tests/ ou scripts/ (arquivo novo
// incluído), roda typecheck e lint. A falha volta para o Claude com exit 2, e ele continua até corrigir.
import { git, lerEntrada, pnpm, ultimasLinhas } from './comum.mjs'

const PASTAS = ['app', 'componentes', 'lib', 'tests', 'scripts']

await lerEntrada()
const mudancas = git(['status', '--porcelain', '--', ...PASTAS])
if (mudancas.status === 0 && mudancas.saida !== '') {
  const falhas = []
  for (const script of ['typecheck', 'lint']) {
    const r = pnpm([script])
    if (r.status !== 0) falhas.push(`pnpm ${script} falhou:\n${ultimasLinhas(r.saida, 40)}`)
  }
  if (falhas.length) {
    process.stderr.write(
      `Há mudança em ${PASTAS.join('/, ')}/ e a verificação não passou. Corrija antes de encerrar.\n\n${falhas.join('\n\n')}\n`,
    )
    process.exit(2)
  }
}
