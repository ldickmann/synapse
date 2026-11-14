// SessionStart (startup|resume|compact): o estado do git entra no contexto do Claude, como texto.
import { git, lerEntrada } from './comum.mjs'

await lerEntrada()
const branch = git(['branch', '--show-current']).saida || '(HEAD destacado)'
const status = git(['status', '--short']).saida || '(árvore limpa)'
const tag = git(['describe', '--tags', '--abbrev=0'])
const commits = git(['log', '--oneline', '-5']).saida

const linhas = [
  `Branch: ${branch}`,
  `git status --short:\n${status}`,
  `Última tag: ${tag.status === 0 ? tag.saida : 'nenhuma'}`,
  `Últimos commits:\n${commits}`,
]
if (branch === 'main' || branch === 'develop') {
  linhas.push(
    `Atenção: ${branch} só recebe PR. Antes de mudar arquivos, crie a branch: git switch -c <tipo>/<assunto>.`,
  )
}
process.stdout.write(`${linhas.join('\n\n')}\n`)
