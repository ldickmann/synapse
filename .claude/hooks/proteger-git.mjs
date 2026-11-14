// PreToolUse (Bash|PowerShell): nega commit em main ou develop, qualquer jeito de pular o hook commit-msg
// (--no-verify e as abreviações que o git aceita, -n no commit, HUSKY=0, core.hooksPath) e push em qualquer forma.
// Push, PR e merge são do Lucas. A regra `deny` de .claude/settings.json pega `git push`, mas não `git -C . push`
// nem o git dentro de subshell, $( ), crase, chaves, heredoc ou bash -c; este hook lê esses lugares também.
// É uma rede contra engano, não uma barreira: comando montado em variável, alias do git e script em arquivo passam.
import path from 'node:path'
import { git, lerEntrada, negar } from './comum.mjs'

const PROTEGIDAS = new Set(['main', 'develop'])
// Subcomandos que criam commit na branch atual, com as opções que só encerram ou abandonam a operação.
const CRIAM_COMMIT = new Map([
  ['commit', []],
  ['merge', ['--abort', '--quit', '--ff-only']],
  ['cherry-pick', ['--abort', '--quit']],
  ['revert', ['--abort', '--quit']],
  ['am', ['--abort', '--quit']],
])
// Opções curtas do `git commit` que levam valor: o resto do grupo, ou o argumento seguinte, é o valor.
const COMMIT_COM_VALOR = new Set(['m', 'F', 'C', 'c', 't'])
// Opções curtas do `git commit` com valor opcional, que só vem colado: o resto do grupo é o valor (-uno, -S<chave>).
const COMMIT_COM_VALOR_COLADO = new Set(['u', 'S'])
// Opções globais do git, antes do subcomando, que levam valor (no argumento seguinte ou depois do `=`).
const GLOBAIS_COM_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env'])
// Opções do `git switch` e do `git checkout` que criam a branch do argumento seguinte e vão para ela.
const CRIAM_BRANCH = new Set(['-c', '-C', '-b', '-B', '--create', '--force-create', '--orphan'])
const DESTACADO = '(HEAD destacado)'
const HUSKY = /^(?:HUSKY=|\$\{?env:HUSKY\b|env:HUSKY$)/i
const ESCAPE = { bash: '\\', powershell: '`', cmd: '^' }

/** Índice de `alvo` a partir de `inicio`, ou o fim do texto. */
function fimDe(texto, alvo, inicio) {
  const i = texto.indexOf(alvo, inicio)
  return i === -1 ? texto.length : i
}

/** Índice do `)` que fecha o `(` em `inicio`, pulando o que está entre aspas; o fim do texto se não fecha. */
function fecharParentese(texto, inicio) {
  let nivel = 0
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i]
    if (c === "'" || c === '"') i = fimDe(texto, c, i + 1)
    else if (c === '(') nivel++
    else if (c === ')' && --nivel === 0) return i
  }
  return texto.length
}

/** Índice da crase que fecha a aberta antes de `inicio`, pulando as escapadas; o fim do texto se não fecha. */
function fimDaCrase(texto, inicio) {
  let i = inicio
  while (i < texto.length && texto[i] !== '`') i += texto[i] === '\\' ? 2 : 1
  return Math.min(i, texto.length)
}

/** Os comandos de $( ) e, se `crase`, de `…` num texto que o shell expande (corpo de heredoc, here-string). */
function substituicoes(texto, crase) {
  const comandos = []
  for (let i = 0; i < texto.length; i++) {
    if (crase && texto[i] === '\\') {
      i++
    } else if (texto[i] === '$' && texto[i + 1] === '(') {
      const fim = fecharParentese(texto, i + 1)
      comandos.push(texto.slice(i + 2, fim))
      i = fim
    } else if (crase && texto[i] === '`') {
      const fim = fimDaCrase(texto, i + 1)
      comandos.push(texto.slice(i + 1, fim))
      i = fim
    }
  }
  return comandos
}

/**
 * Tira o corpo de heredocs (bash) e de here-strings (PowerShell), que é texto e não comando. Só o corpo sai: o resto
 * da linha do `<<` continua sendo comando. O que roda dentro do corpo vai para `extras`: $( ) e crase no heredoc
 * com o delimitador sem aspas, $( ) na here-string de aspas duplas.
 */
function semTextoLivre(comando, extras) {
  return comando
    .replace(
      /(?<!<)<<(?!<)-?[ \t]*(\\|(['"]?))([\w.-]+)\2([^\n]*)\n(?:([\s\S]*?)\n)?[ \t]*\3[ \t]*(?=\r?\n|$)/g,
      (_, citado, _aspas, _delimitador, resto, corpo = '') => {
        if (!citado) extras.push(...substituicoes(corpo, true))
        return `<<texto${resto}`
      },
    )
    .replace(/@(['"])\r?\n([\s\S]*?)\r?\n\1@/g, (_, aspas, corpo) => {
      if (aspas === '"') extras.push(...substituicoes(corpo, false))
      return "''"
    })
}

/**
 * Lê o texto entre aspas duplas a partir de `inicio`. Devolve o texto sem as aspas e os escapes, o índice da aspa
 * que fecha e os comandos de $( ) e (no bash) de crase, que o shell roda mesmo entre aspas duplas.
 */
function aspasDuplas(comando, inicio, shell) {
  let texto = ''
  const comandos = []
  let i = inicio
  for (; i < comando.length && comando[i] !== '"'; i++) {
    const c = comando[i]
    if (shell === 'bash' && c === '\\' && '$`"\\\n'.includes(comando[i + 1] ?? '')) {
      texto += comando[++i]
    } else if (shell === 'powershell' && c === '`') {
      texto += comando[++i] ?? ''
    } else if (shell !== 'cmd' && c === '$' && comando[i + 1] === '(') {
      const fim = fecharParentese(comando, i + 1)
      comandos.push(comando.slice(i + 2, fim))
      texto += comando.slice(i, fim + 1)
      i = fim
    } else if (shell === 'bash' && c === '`') {
      const fim = fimDaCrase(comando, i + 1)
      comandos.push(comando.slice(i + 1, fim))
      texto += comando.slice(i, fim + 1)
      i = fim
    } else {
      texto += c
    }
  }
  return { texto, fim: i, comandos }
}

/**
 * Divide o comando em trechos e cada trecho em palavras, como o shell entrega ao programa: aspas e escapes já
 * resolvidos, de modo que `"--no-verify"` e `'-n'` contam como opção. Separam trechos &&, ||, ;, |, &, quebra de
 * linha, parênteses, chaves e (no bash) crase, então o git de subshell, $( ), `…` e { } vira trecho próprio. O que
 * roda dentro de $( ) entre aspas duplas entra antes do trecho que o contém. Comentário (`#` depois de espaço ou de
 * separador) não conta; o `#` de `${#x}` não é comentário.
 */
function trechos(comando, shell) {
  const escape = ESCAPE[shell]
  const saida = []
  let atual = []
  let palavra = null
  const juntar = (texto) => (palavra = (palavra ?? '') + texto)
  const fecharPalavra = () => {
    if (palavra !== null) atual.push(palavra)
    palavra = null
  }
  const fecharTrecho = () => {
    fecharPalavra()
    if (atual.length) saida.push(atual)
    atual = []
  }
  for (let i = 0; i < comando.length; i++) {
    const c = comando[i]
    const proximo = comando[i + 1]
    if (c === escape) {
      i++
      if (i < comando.length && comando[i] !== '\n') juntar(comando[i])
    } else if (c === "'" && shell !== 'cmd') {
      const fim = fimDe(comando, "'", i + 1)
      juntar(comando.slice(i + 1, fim))
      i = fim
    } else if (c === '"') {
      const aspas = aspasDuplas(comando, i + 1, shell)
      saida.push(...aspas.comandos.flatMap((interno) => trechos(interno, shell)))
      juntar(aspas.texto)
      i = aspas.fim
    } else if (c === '$' && proximo === "'" && shell === 'bash') {
      // $'…' do bash: o `$` sai, e as aspas são lidas na volta seguinte.
    } else if (c === '#' && palavra === null && shell !== 'cmd' && /^$|[\s;&|()]$/.test(comando[i - 1] ?? '')) {
      i = fimDe(comando, '\n', i) - 1
    } else if (c === ' ' || c === '\t' || c === '\r') {
      fecharPalavra()
    } else if (c === '&' && (proximo === '>' || /[<>]$/.test(palavra ?? ''))) {
      juntar(c) // redirecionamento (2>&1, &>arquivo), não separador
    } else if ('\n;|&(){}'.includes(c) || (c === '`' && shell === 'bash')) {
      fecharTrecho()
    } else {
      juntar(c)
    }
  }
  fecharTrecho()
  return saida
}

/** Nome do programa de uma palavra, sem pasta, sem .exe e em minúsculas. */
function programa(palavra) {
  return palavra
    .split(/[\\/]/)
    .at(-1)
    .toLowerCase()
    .replace(/\.exe$/, '')
}

/** Shell cuja sintaxe vale para o texto que o programa recebe como comando, ou null. */
function shellDoPrograma(nome) {
  if (/^(?:a|ba|da|k|z)?sh$/.test(nome) || nome === 'eval') return 'bash'
  if (['pwsh', 'powershell', 'invoke-expression', 'iex'].includes(nome)) return 'powershell'
  if (nome === 'cmd') return 'cmd'
  return null
}

/** `-EncodedCommand` do pwsh e as formas curtas que ele aceita (-e, -ec, -enc…). */
function ehComandoCodificado(palavra) {
  if (!/^(?:-{1,2}|\/)\w/.test(palavra)) return false
  const chave = palavra.replace(/^(?:-{1,2}|\/)/, '').toLowerCase()
  return chave === 'ec' || 'encodedcommand'.startsWith(chave)
}

/**
 * Comandos que um trecho passa a outro shell: `bash -c '…'`, `sh -c`, `pwsh -Command "…"`, `powershell -c`,
 * `cmd /c`, `eval`, `Invoke-Expression` e o `-EncodedCommand` do pwsh. As palavras depois do programa são juntadas
 * de novo, o que cobre o comando numa palavra só (entre aspas) e espalhado em várias (sem aspas).
 */
function comandosInternos(palavras) {
  const internos = []
  palavras.forEach((palavra, i) => {
    const shell = shellDoPrograma(programa(palavra))
    if (!shell) return
    const resto = palavras.slice(i + 1)
    internos.push({ comando: resto.join(' '), shell })
    if (shell !== 'powershell') return
    const codificado = resto.findIndex(ehComandoCodificado)
    if (codificado !== -1 && resto[codificado + 1]) {
      internos.push({ comando: Buffer.from(resto[codificado + 1], 'base64').toString('utf16le'), shell })
    }
  })
  return internos
}

/** Lê uma invocação do git num trecho: diretório (-C), configurações (-c), subcomando e argumentos. */
function lerGit(palavras) {
  const inicio = palavras.findIndex((p) => programa(p) === 'git')
  if (inicio === -1) return null
  const r = { dir: null, configs: [], sub: null, args: [] }
  let i = inicio + 1
  for (; i < palavras.length && palavras[i].startsWith('-'); i++) {
    const t = palavras[i]
    const igual = t.startsWith('--') ? t.indexOf('=') : -1
    const nome = igual === -1 ? t : t.slice(0, igual)
    if (!GLOBAIS_COM_VALOR.has(nome)) continue
    const valor = igual === -1 ? (palavras[++i] ?? '') : t.slice(igual + 1)
    if (nome === '-C') r.dir = r.dir ? path.join(r.dir, valor) : valor
    else if (nome === '-c' || nome === '--config-env') r.configs.push(valor)
  }
  r.sub = palavras[i] ?? null
  r.args = palavras.slice(i + 1)
  return r
}

/** Os argumentos antes do `--`, onde ainda há opção. */
function opcoesDe(args) {
  const fim = args.indexOf('--')
  return fim === -1 ? args : args.slice(0, fim)
}

/** `--no-verify` ou uma abreviação dele (o git aceita prefixos sem ambiguidade, como --no-veri). */
function ehNoVerify(opcao) {
  const nome = opcao.split('=')[0]
  return nome.length >= '--no-v'.length && '--no-verify'.startsWith(nome)
}

/** `git commit -n`, também agrupado (`-an`, `-nm x`): pula o hook, como --no-verify. */
function commitComN(opcoes) {
  for (let i = 0; i < opcoes.length; i++) {
    const t = opcoes[i]
    if (!/^-[^-]/.test(t)) continue
    for (let j = 1; j < t.length; j++) {
      if (t[j] === 'n') return true
      if (COMMIT_COM_VALOR_COLADO.has(t[j])) break
      if (COMMIT_COM_VALOR.has(t[j])) {
        if (j === t.length - 1) i++
        break
      }
    }
  }
  return false
}

/** `git config` que grava ou apaga o core.hooksPath (ler com --get continua livre). */
function mudaHooksPath(g) {
  if (g.configs.some((c) => /^core\.hookspath(?:=|$)/i.test(c))) return true
  if (g.sub !== 'config') return false
  const chave = g.args.findIndex((t) => /^core\.hookspath$/i.test(t))
  if (chave === -1) return false
  return chave < g.args.length - 1 || g.args.some((t) => ['--unset', '--unset-all', 'unset'].includes(t))
}

function branchAtual(onde, ref = 'HEAD') {
  const r = git(['rev-parse', '--abbrev-ref', ref], onde)
  return r.status === 0 ? r.saida : null
}

/** Raiz do repositório de `onde`: as trocas de branch ficam registradas por repositório. */
function repoDe(onde, estado) {
  if (!estado.raizes.has(onde)) {
    const r = git(['rev-parse', '--show-toplevel'], onde)
    estado.raizes.set(onde, r.status === 0 ? path.resolve(r.saida) : onde)
  }
  return estado.raizes.get(onde)
}

/** Branch em que o próximo commit cai: a da última troca deste comando, ou a atual do repositório. */
function branchDoCommit(onde, estado) {
  if (estado.branches.size === 0) return branchAtual(onde)
  return estado.branches.get(repoDe(onde, estado))?.branch ?? branchAtual(onde)
}

/** Branch de `git switch -` ou `git checkout -`. */
function branchAnterior(onde, estado) {
  const registro = estado.branches.get(repoDe(onde, estado))
  if (!registro) return branchAtual(onde, '@{-1}')
  return registro.anterior ?? branchAtual(onde)
}

/** Branch local, branch criada antes neste comando, ou remota de mesmo nome, que o checkout cria localmente. */
function ehBranch(nome, onde, estado) {
  if (estado.criadas.has(nome)) return true
  if (git(['rev-parse', '--verify', '--quiet', `refs/heads/${nome}`], onde).status === 0) return true
  return git(['for-each-ref', '--count=1', '--format=%(refname)', `refs/remotes/*/${nome}`], onde).saida !== ''
}

/**
 * Branch de destino de um `git switch` ou `git checkout` que troca de branch, ou null. Um `git checkout <arquivo>`
 * (ou `<árvore> <arquivos>`, ou com `--`) restaura arquivos e não troca: só conta o nome que for branch.
 */
function destinoDaTroca(g, onde, estado) {
  if (g.sub !== 'switch' && g.sub !== 'checkout') return null
  const posicionais = []
  for (let i = 0; i < g.args.length; i++) {
    const t = g.args[i]
    if (t === '--') {
      if (g.sub === 'checkout') return null
      continue
    }
    const igual = t.startsWith('--') ? t.indexOf('=') : -1
    const nome = igual === -1 ? t : t.slice(0, igual)
    if (CRIAM_BRANCH.has(nome)) {
      const criada = igual === -1 ? g.args[i + 1] : t.slice(igual + 1)
      if (criada) estado.criadas.add(criada)
      return criada ?? null
    }
    if (nome === '--detach' || (g.sub === 'switch' && nome === '-d')) return DESTACADO
    if (t === '-' || !t.startsWith('-')) posicionais.push(t)
  }
  if (posicionais.length === 0 || (g.sub === 'checkout' && posicionais.length > 1)) return null
  const [nome] = posicionais
  if (nome === '-') return branchAnterior(onde, estado)
  return g.sub === 'switch' || ehBranch(nome, onde, estado) ? nome : null
}

function avaliarGit(g, cwd, estado) {
  if (mudaHooksPath(g)) {
    return 'Mudar o core.hooksPath desliga o hook commit-msg do commitlint.'
  }
  if (g.sub === 'push') {
    return 'Push é do Lucas: a tarefa termina nos commits, com o aviso (commits, comandos de push e PR sugerido).'
  }
  const opcoes = opcoesDe(g.args)
  if (opcoes.some(ehNoVerify)) {
    return '--no-verify (ou uma abreviação dele) pula o hook commit-msg do commitlint. Corrija a mensagem em vez de pular a checagem.'
  }
  const onde = path.resolve(cwd, g.dir ?? '.')
  const destino = destinoDaTroca(g, onde, estado)
  if (destino) {
    const repo = repoDe(onde, estado)
    const registro = estado.branches.get(repo)
    // Sem registro, a branch anterior é a atual do repositório (null aqui).
    estado.branches.set(repo, { branch: destino, anterior: registro ? registro.branch : null })
    return null
  }
  if (g.sub === 'commit' && commitComN(opcoes)) {
    return '`git commit -n` é o --no-verify: pula o hook commit-msg do commitlint.'
  }
  const isencoes = CRIAM_COMMIT.get(g.sub)
  if (isencoes && !opcoes.some((t) => isencoes.includes(t))) {
    const alvo = branchDoCommit(onde, estado)
    if (PROTEGIDAS.has(alvo)) {
      return `\`git ${g.sub}\` em ${alvo}: ${alvo} só recebe PR. Crie uma branch <tipo>/<assunto> a partir de develop (git switch -c <tipo>/<assunto>) e faça o commit nela.`
    }
  }
  return null
}

function avaliar(comando, shell, cwd, estado, nivel = 0) {
  if (nivel > 8) return null
  const extras = []
  const texto = semTextoLivre(comando, extras)
  for (const interno of extras) {
    const motivo = avaliar(interno, shell, cwd, estado, nivel + 1)
    if (motivo) return motivo
  }
  for (const palavras of trechos(texto, shell)) {
    if (palavras.some((p) => HUSKY.test(p))) {
      return 'HUSKY=0 desliga o hook commit-msg do commitlint. Faça o commit com o hook ligado.'
    }
    for (const interno of comandosInternos(palavras)) {
      const motivo = avaliar(interno.comando, interno.shell, cwd, estado, nivel + 1)
      if (motivo) return motivo
    }
    const g = lerGit(palavras)
    const motivo = g && avaliarGit(g, cwd, estado)
    if (motivo) return motivo
  }
  return null
}

const entrada = await lerEntrada()
const comando = entrada.tool_input?.command
if (typeof comando === 'string') {
  const shell = entrada.tool_name === 'PowerShell' ? 'powershell' : 'bash'
  const estado = { branches: new Map(), raizes: new Map(), criadas: new Set() }
  const motivo = avaliar(comando, shell, entrada.cwd || process.cwd(), estado)
  if (motivo) negar(motivo)
}
