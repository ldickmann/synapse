// Workspace de uma tentativa: um clone novo do commit base, numa raiz curta fora do repositório, com o harness do
// braço num commit de mensagem, autor e data fixos, uma origem falsa e as dependências instaladas (evals/README.md).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  ambienteBase,
  executarPnpm,
  git,
  gitOk,
  RAIZ,
  sha256,
  ultimasLinhas,
  type Ambiente,
  type Suite,
} from './comum.ts'

export type Workspace = {
  id: string
  /** C:\ev\<id>: tudo da tentativa fica aqui dentro e sai junto. */
  pasta: string
  /** O clone, onde o agente trabalha. Leva o nome do repositório, como a cópia de trabalho do Lucas. */
  repo: string
  /** Cópia --bare do próprio clone, no lugar do GitHub: um push cairia aqui. */
  origem: string
  tmp: string
  cfg: string
  gh: string
  gitconfig: string
  /** O commit em que o agente começa: o `develop` do clone. */
  inicio: string
  /** As refs da origem falsa no começo, para conferir que nada foi enviado a ela. */
  refsDaOrigem: string
}

/** O ambiente do git e do pnpm do runner no workspace: o gitconfig próprio, sem credencial nem identidade do Lucas. */
export function ambienteDoWorkspace(ws: Pick<Workspace, 'gitconfig' | 'tmp'>): Ambiente {
  return { ...ambienteBase(), GIT_CONFIG_GLOBAL: ws.gitconfig, TEMP: ws.tmp, TMP: ws.tmp }
}

let ultimoId = ''

/** Nome curto e sem pista do caso: o agente vê a pasta. */
function novoId(): string {
  let id = Date.now().toString(36)
  while (id === ultimoId) id = (Date.now() + 1).toString(36)
  ultimoId = id
  return id
}

/** Caminhos que o patch do harness muda, pelos cabeçalhos `diff --git a/… b/…`. */
function caminhosDoPatch(patch: string): string[] {
  const caminhos = new Set<string>()
  for (const m of patch.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)) {
    caminhos.add(m[1])
    caminhos.add(m[2])
  }
  return [...caminhos]
}

export function conferirPatchDoHarness(patch: string): void {
  const fora = caminhosDoPatch(patch).filter((c) => c !== 'CLAUDE.md' && !c.startsWith('.claude/'))
  if (fora.length)
    throw new Error(`O harness.patch só pode mudar CLAUDE.md e .claude/**; muda também: ${fora.join(', ')}`)
}

export type OpcoesDoWorkspace = {
  suite: Suite
  /** Conteúdo do harness.patch do braço; vazio na linha de base. */
  harnessPatch: string
  /** preparo.patch do caso, no formato do `git format-patch`, ou null. */
  preparo: string | null
  log: (mensagem: string) => void
}

export async function criarWorkspace(opcoes: OpcoesDoWorkspace): Promise<Workspace> {
  const { suite, log } = opcoes
  const id = novoId()
  const pasta = path.join(suite.raiz_workspaces, id)
  if (existsSync(pasta)) throw new Error(`O workspace ${pasta} já existe: o claude nunca roda num workspace usado.`)
  const ws: Workspace = {
    id,
    pasta,
    repo: path.join(pasta, 'synapse'),
    origem: path.join(pasta, 'origem.git'),
    tmp: path.join(pasta, 'tmp'),
    cfg: path.join(pasta, 'cfg'),
    gh: path.join(pasta, 'gh'),
    gitconfig: path.join(pasta, 'gitconfig'),
    inicio: '',
    refsDaOrigem: '',
  }
  for (const dir of [ws.tmp, ws.cfg, ws.gh]) mkdirSync(dir, { recursive: true })
  const autor = suite.commit_do_harness
  writeFileSync(
    ws.gitconfig,
    `[user]\n\tname = ${autor.nome}\n\temail = ${autor.email}\n[credential]\n\thelper =\n[advice]\n\tdetachedHead = false\n`,
  )
  const env = ambienteDoWorkspace(ws)

  // Clone de uma branch só, até a tag: sem --no-local, o clone local traria o banco de objetos inteiro, com a
  // história depois do base (evals/ e os resultados).
  log(`workspace ${pasta}: clone de ${suite.base.tag}`)
  gitOk(
    ['clone', '--quiet', '--no-local', '--single-branch', '--branch', suite.base.tag, '--no-tags', RAIZ, ws.repo],
    pasta,
    env,
  )
  const base = gitOk(['rev-parse', 'HEAD'], ws.repo, env)
  if (base !== suite.base.commit)
    throw new Error(`${suite.base.tag} aponta para ${base}, e a suíte espera ${suite.base.commit}.`)
  gitOk(['switch', '--quiet', '-c', 'develop'], ws.repo, env)
  gitOk(['remote', 'remove', 'origin'], ws.repo, env)

  // O harness entra num commit igual em todos os braços, vazio na linha de base: o hook de início mostra
  // `git log --oneline -5`, e uma mensagem por experimento diria ao agente qual braço está rodando.
  if (opcoes.harnessPatch.trim()) {
    conferirPatchDoHarness(opcoes.harnessPatch)
    const arquivo = path.join(pasta, 'harness.patch')
    writeFileSync(arquivo, opcoes.harnessPatch)
    gitOk(['apply', '--index', arquivo], ws.repo, env)
  }
  const envDoCommit = {
    ...env,
    GIT_AUTHOR_NAME: autor.nome,
    GIT_AUTHOR_EMAIL: autor.email,
    GIT_AUTHOR_DATE: autor.data,
    GIT_COMMITTER_NAME: autor.nome,
    GIT_COMMITTER_EMAIL: autor.email,
    GIT_COMMITTER_DATE: autor.data,
  }
  // Antes do install o Husky ainda não está ligado: este commit não passa pelo commitlint, e a mensagem já segue o padrão.
  gitOk(['commit', '--quiet', '--allow-empty', '-m', autor.mensagem], ws.repo, envDoCommit)
  if (opcoes.preparo) {
    const arquivo = path.join(pasta, 'preparo.patch')
    writeFileSync(arquivo, opcoes.preparo)
    gitOk(['am', '--quiet', '--committer-date-is-author-date', arquivo], ws.repo, envDoCommit)
  }
  ws.inicio = gitOk(['rev-parse', 'HEAD'], ws.repo, env)

  // A origem falsa nasce do próprio clone, já com o harness: origin/develop igual ao develop, como no repositório
  // do Lucas depois de um fetch.
  gitOk(['clone', '--quiet', '--bare', '--no-local', ws.repo, ws.origem], pasta, env)
  gitOk(['remote', 'add', 'origin', ws.origem], ws.repo, env)
  gitOk(['fetch', '--quiet', 'origin'], ws.repo, env)
  gitOk(['branch', '--quiet', '--set-upstream-to=origin/develop', 'develop'], ws.repo, env)
  ws.refsDaOrigem = gitOk(['for-each-ref', '--format=%(refname) %(objectname)'], ws.origem, env)

  // Sem reflog nem objeto solto: o agente não acha, pelo git, nada além da história até o base.
  gitOk(['reflog', 'expire', '--expire=now', '--all'], ws.repo, env)
  gitOk(['gc', '--quiet', '--prune=now'], ws.repo, env)
  const soltos = gitOk(['fsck', '--unreachable', '--no-reflogs', '--no-progress'], ws.repo, env)
  if (soltos) throw new Error(`git fsck achou objetos soltos no workspace:\n${soltos}`)

  log(`workspace ${pasta}: pnpm install`)
  const install = await executarPnpm(['install', '--frozen-lockfile', '--prefer-offline'], {
    cwd: ws.repo,
    env,
    tempoMs: 10 * 60_000,
  })
  if (install.status !== 0) {
    throw new Error(`pnpm install falhou no workspace:\n${ultimasLinhas(install.saida + install.erro, 30)}`)
  }
  // O `prepare` do package.json liga o Husky, e é ele que roda o commitlint no commit-msg.
  const hooks = git(['config', '--get', 'core.hooksPath'], ws.repo, env).saida
  if (hooks !== '.husky/_') throw new Error(`core.hooksPath ficou "${hooks}" depois do install; esperado .husky/_`)
  const sujo = gitOk(['status', '--porcelain'], ws.repo, env)
  if (sujo) throw new Error(`O workspace não ficou limpo depois do install:\n${sujo}`)
  // Fora do clone, para uma avaliação que não terminou poder ser refeita no mesmo workspace.
  writeFileSync(path.join(pasta, 'workspace.json'), `${JSON.stringify(ws, null, 2)}\n`)
  return ws
}

export function apagarWorkspace(ws: Pick<Workspace, 'pasta'>): void {
  rmSync(ws.pasta, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
}

/**
 * Tipo do commit de um patch do `git format-patch`, pelo Subject (`fix(fundo): …` dá `fix`). Com acento, o git
 * codifica o Subject (`=?UTF-8?q?feat(fundo):=20…`), e o tipo vem logo depois do prefixo.
 */
export function tipoDoPatch(patch: string): string {
  const assunto = patch.match(/^Subject: (?:\[PATCH[^\]]*\] )?(?:=\?UTF-8\?[qQ]\?)?(\w+)/m)
  if (!assunto) throw new Error('O patch não tem a linha Subject do git format-patch.')
  return assunto[1]
}

/**
 * Faz no workspace o que a variante sem modelo representa: cria a branch `<tipo>/<id do caso>` e aplica o patch com
 * `git am`, que traz a mensagem e o autor do commit. A variante nula não muda nada.
 */
export function aplicarVariante(ws: Workspace, idDoCaso: string, patch: string | null): void {
  if (!patch) return
  const env = ambienteDoWorkspace(ws)
  const arquivo = path.join(ws.pasta, `variante-${sha256(patch).slice(0, 8)}.patch`)
  writeFileSync(arquivo, patch)
  gitOk(['switch', '--quiet', '-c', `${tipoDoPatch(patch)}/${idDoCaso}`], ws.repo, env)
  gitOk(['am', '--quiet', arquivo], ws.repo, env)
}

/** Lê um patch do caso, se existir. */
export function lerPatch(pasta: string, nome: string): string | null {
  const arquivo = path.join(pasta, nome)
  return existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : null
}
