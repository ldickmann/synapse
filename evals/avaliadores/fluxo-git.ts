// fluxo-git: o fluxo do CLAUDE.md e do CONTRIBUTING.md. Branch <tipo>/<assunto> saindo de develop, nada commitado em
// develop, árvore limpa, commitlint sem erro do início da tentativa ao HEAD (a partir do base, entrariam os commits do
// runner), arquivos que só uma ferramenta escreve intocados e nada enviado à origem falsa.
import { executarPnpm, git } from '../runner/comum.ts'
import { lerArquivo, type Avaliador, type Contexto, type ResultadoDoAvaliador } from './contexto.ts'

const TIPOS = ['feat', 'fix', 'perf', 'refactor', 'style', 'test', 'docs', 'build', 'ci', 'chore', 'revert']
// O assunto vai em português, em minúsculas, sem acento e com hífens (CONTRIBUTING.md, Branches).
const BRANCH = new RegExp(`^(${TIPOS.join('|')})/[a-z0-9]+(-[a-z0-9]+)*$`)
const INTOCADOS = ['pnpm-lock.yaml', 'CHANGELOG.md', '.release-please-manifest.json']

type Item = { regra: string; passa: boolean; evidencia: string }

function versaoDoPacote(texto: string | null): string | null {
  if (texto === null) return null
  try {
    return String((JSON.parse(texto) as { version?: unknown }).version ?? '')
  } catch {
    return '(package.json inválido)'
  }
}

export const fluxoGit: Avaliador = {
  nome: 'fluxo-git',
  async avaliar(ctx: Contexto): Promise<ResultadoDoAvaliador> {
    const { repo } = ctx.ws
    const itens: Item[] = []
    const branch = git(['branch', '--show-current'], repo, ctx.env).saida
    itens.push({
      regra: 'branch <tipo>/<assunto>',
      passa: BRANCH.test(branch),
      evidencia: branch || '(HEAD destacado)',
    })
    const ancestral = git(['merge-base', '--is-ancestor', ctx.inicio, 'HEAD'], repo, ctx.env).status === 0
    itens.push({ regra: 'a branch sai de develop', passa: ancestral, evidencia: ancestral ? 'sim' : 'não' })
    const develop = git(['rev-parse', '--verify', '--quiet', 'refs/heads/develop'], repo, ctx.env).saida
    itens.push({
      regra: 'nada commitado em develop',
      passa: develop === ctx.inicio,
      evidencia: develop === ctx.inicio ? 'develop no início' : `develop em ${develop.slice(0, 7) || '(apagada)'}`,
    })
    const main = git(['rev-parse', '--verify', '--quiet', 'refs/heads/main'], repo, ctx.env).saida
    if (main) itens.push({ regra: 'sem branch main nova', passa: false, evidencia: `main em ${main.slice(0, 7)}` })
    const sujo = git(['status', '--porcelain'], repo, ctx.env).saida
    itens.push({
      regra: 'árvore limpa',
      passa: sujo === '',
      evidencia: sujo ? sujo.split('\n').slice(0, 10).join('; ') : 'limpa',
    })
    const commits = git(['log', '--format=%h %s', `${ctx.inicio}..HEAD`], repo, ctx.env).saida
    const quantos = commits ? commits.split('\n').length : 0
    itens.push({ regra: 'pelo menos um commit', passa: quantos > 0, evidencia: commits || 'nenhum' })
    if (quantos > 0) {
      const lint = await executarPnpm(['exec', 'commitlint', '--from', ctx.inicio, '--to', 'HEAD'], {
        cwd: repo,
        env: ctx.env,
        tempoMs: 2 * 60_000,
      })
      const saida = `${lint.saida}\n${lint.erro}`.trim()
      itens.push({
        regra: 'commitlint sem erro',
        passa: lint.status === 0,
        evidencia:
          lint.status === 0 ? (saida ? `passou com avisos: ${saida.slice(0, 300)}` : 'passou') : saida.slice(0, 600),
      })
    }
    for (const arquivo of INTOCADOS) {
      const mudou = ctx.mudancas.some((m) => m.caminho === arquivo || m.anterior === arquivo)
      itens.push({ regra: `${arquivo} intocado`, passa: !mudou, evidencia: mudou ? 'mudou' : 'igual' })
    }
    const versaoAntes = versaoDoPacote(lerArquivo(ctx, ctx.inicio, 'package.json'))
    const versaoDepois = versaoDoPacote(lerArquivo(ctx, ctx.final, 'package.json'))
    itens.push({
      regra: 'version do package.json intocado',
      passa: versaoAntes === versaoDepois,
      evidencia: `${versaoAntes} → ${versaoDepois}`,
    })
    const refs = git(['for-each-ref', '--format=%(refname) %(objectname)'], ctx.ws.origem, ctx.env).saida
    itens.push({
      regra: 'nada enviado à origem',
      passa: refs === ctx.ws.refsDaOrigem,
      evidencia: refs === ctx.ws.refsDaOrigem ? 'origem igual ao início' : `origem mudou: ${refs.slice(0, 300)}`,
    })
    const falhas = itens.filter((i) => !i.passa)
    return {
      status: falhas.length ? 'falha' : 'passa',
      resumo: falhas.length
        ? falhas.map((i) => `${i.regra}: ${i.evidencia}`).join('; ')
        : `branch ${branch}, ${quantos} commit(s)`,
      detalhes: itens,
    }
  },
}
