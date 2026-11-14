// PreToolUse (Bash|PowerShell): nega commit em main ou develop, qualquer jeito de pular o hook commit-msg
// (--no-verify, -n no commit, HUSKY=0, core.hooksPath) e push em qualquer forma. Push, PR e merge são do Lucas;
// a regra `deny` de .claude/settings.json pega `git push`, mas não `git -C . push`, e este hook pega os dois.
import path from 'node:path'
import { git, lerEntrada, negar } from './comum.mjs'

const PROTEGIDAS = new Set(['main', 'develop'])
// Subcomandos que criam commit na branch atual.
const CRIAM_COMMIT = new Set(['commit', 'merge', 'cherry-pick', 'revert', 'am'])
// Opções curtas do `git commit` que levam valor: o resto do grupo (ou o próximo argumento) é o valor.
const COMMIT_COM_VALOR = new Set(['m', 'F', 'C', 'c', 't'])

/** Tira o corpo de heredocs (bash) e here-strings (PowerShell): é texto, não comando. */
function semTextoLivre(comando) {
  return comando
    .replace(/<<-?[ \t]*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\r?\n|$)/g, '<<texto')
    .replace(/@(['"])\r?\n[\s\S]*?\r?\n\1@/g, "''")
}

/**
 * Divide o comando em trechos (separados por &&, ||, ;, |, & e quebra de linha) e cada trecho em palavras,
 * respeitando aspas simples e duplas. Cada palavra diz se começa entre aspas (então não é opção).
 */
function trechos(comando) {
  const saida = [[]]
  let palavra = null
  const fechar = () => {
    if (palavra) saida.at(-1).push(palavra)
    palavra = null
  }
  for (let i = 0; i < comando.length; i++) {
    const c = comando[i]
    if (c === "'" || c === '"') {
      const fim = comando.indexOf(c, i + 1)
      const conteudo = comando.slice(i + 1, fim === -1 ? undefined : fim)
      palavra = { texto: (palavra?.texto ?? '') + conteudo, citada: palavra ? palavra.citada : true }
      i = fim === -1 ? comando.length : fim
    } else if (/[\s]/.test(c) && c !== '\n') {
      fechar()
    } else if (c === '\n' || c === ';' || c === '|' || c === '&') {
      fechar()
      if (saida.at(-1).length) saida.push([])
      if ((c === '|' || c === '&') && comando[i + 1] === c) i++
    } else {
      palavra = { texto: (palavra?.texto ?? '') + c, citada: palavra?.citada ?? false }
    }
  }
  fechar()
  return saida.filter((t) => t.length)
}

/** Lê uma invocação do git num trecho: diretório (-C), configurações (-c), subcomando e argumentos. */
function lerGit(trecho) {
  const inicio = trecho.findIndex((p) => /^(?:.*[\\/])?git(?:\.exe)?$/i.test(p.texto))
  if (inicio === -1) return null
  const r = { dir: null, configs: [], sub: null, args: [] }
  let i = inicio + 1
  for (; i < trecho.length; i++) {
    const t = trecho[i].texto
    if (t === '-C') r.dir = trecho[++i]?.texto ?? null
    else if (t === '-c') r.configs.push(trecho[++i]?.texto ?? '')
    else if (t.startsWith('--') || t.startsWith('-')) continue
    else break
  }
  r.sub = trecho[i]?.texto ?? null
  r.args = trecho.slice(i + 1)
  return r
}

/** `git commit -n` (ou `-an`, `-nm`) pula o hook, como --no-verify. */
function commitComN(args) {
  for (let i = 0; i < args.length; i++) {
    const { texto, citada } = args[i]
    if (citada || !/^-[a-zA-Z]+$/.test(texto)) continue
    for (let j = 1; j < texto.length; j++) {
      if (texto[j] === 'n') return true
      if (COMMIT_COM_VALOR.has(texto[j])) {
        if (j === texto.length - 1) i++
        break
      }
    }
  }
  return false
}

/** Branch de destino depois de um `git switch` ou `git checkout`, ou null se o trecho não troca de branch. */
function trocaDeBranch(g) {
  if (g.sub !== 'switch' && g.sub !== 'checkout') return null
  const textos = g.args.map((a) => a.texto)
  if (textos.includes('--')) return null
  const cria = textos.findIndex((t) => ['-c', '-C', '-b', '-B', '--create', '--force-create'].includes(t))
  if (cria !== -1) return textos[cria + 1] ?? null
  return textos.find((t) => !t.startsWith('-')) ?? null
}

function branchAtual(cwd, dir) {
  const onde = dir ? path.resolve(cwd, dir) : cwd
  const r = git(['rev-parse', '--abbrev-ref', 'HEAD'], onde)
  return r.status === 0 ? r.saida : null
}

/** `git config` que grava ou apaga o core.hooksPath (ler com --get continua livre). */
function mudaHooksPath(g) {
  if (g.configs.some((c) => /^core\.hookspath=/i.test(c))) return true
  if (g.sub !== 'config') return false
  const textos = g.args.map((a) => a.texto)
  const chave = textos.findIndex((t) => /^core\.hookspath$/i.test(t))
  if (chave === -1) return false
  return chave < textos.length - 1 || textos.some((t) => ['--unset', '--unset-all', 'unset'].includes(t))
}

function avaliar(comando, cwd) {
  let branch
  for (const trecho of trechos(semTextoLivre(comando))) {
    const soltas = trecho.filter((p) => !p.citada).map((p) => p.texto)
    if (soltas.some((t) => /^(?:\$env:HUSKY\b|HUSKY=)/i.test(t))) {
      return 'HUSKY=0 desliga o hook commit-msg do commitlint. Faça o commit com o hook ligado.'
    }
    if (soltas.some((t) => /^--no-verify(?:=|$)/.test(t))) {
      return '--no-verify pula o hook commit-msg do commitlint. Corrija a mensagem em vez de pular a checagem.'
    }
    const g = lerGit(trecho)
    if (!g) continue
    if (mudaHooksPath(g)) {
      return 'Mudar o core.hooksPath desliga o hook commit-msg do commitlint.'
    }
    if (g.sub === 'push') {
      return 'Push é do Lucas: a tarefa termina nos commits, com o aviso (commits, comandos de push e PR sugerido).'
    }
    const destino = trocaDeBranch(g)
    if (destino) {
      branch = destino
      continue
    }
    if (g.sub === 'commit' && commitComN(g.args)) {
      return '`git commit -n` é o --no-verify: pula o hook commit-msg do commitlint.'
    }
    if (CRIAM_COMMIT.has(g.sub)) {
      const alvo = g.dir ? branchAtual(cwd, g.dir) : (branch ?? (branch = branchAtual(cwd)))
      if (PROTEGIDAS.has(alvo)) {
        return `\`git ${g.sub}\` em ${alvo}: ${alvo} só recebe PR. Crie uma branch <tipo>/<assunto> a partir de develop (git switch -c <tipo>/<assunto>) e faça o commit nela.`
      }
    }
  }
  return null
}

const entrada = await lerEntrada()
const comando = entrada.tool_input?.command
if (typeof comando === 'string') {
  const motivo = avaliar(comando, entrada.cwd || process.cwd())
  if (motivo) negar(motivo)
}
