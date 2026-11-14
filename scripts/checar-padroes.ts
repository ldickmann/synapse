// G21 (lib/ sem visual), G22 (padrões proibidos) e G26 (cor só em app/tokens.css), por leitura dos arquivos do site.
// Uso: node scripts/checar-padroes.ts  (sai com 1 se houver violação)
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

type Violacao = { criterio: 'G21' | 'G22' | 'G26'; arquivo: string; linha: number; mensagem: string; trecho: string }

const RAIZ = path.resolve(import.meta.dirname, '..')
// O site: rotas, componentes e dados. O "→" e os padrões valem em todas; as regras de lib/ só nela.
const PASTAS_DO_SITE = ['app', 'componentes', 'lib']
const LIB = path.join(RAIZ, 'lib')
// Única fonte de cor do site (G26): os canvas leem estes tokens em runtime.
const TOKENS = 'app/tokens.css'
// Exceções declaradas, impressas a cada execução. A assinatura de autoria leva a outros projetos a mesma
// paleta própria e a pilha de fontes do sistema (o Roboto é a do Android).
const EXCECOES: Record<string, { fontes?: true; cores?: true }> = {
  'componentes/AssinaturaEncaixe.tsx': { fontes: true, cores: true },
}
const EXT_TEXTO = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.json', '.md', '.svg', '.html', '.txt'])
const EXT_CODIGO = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const EXT_JSX = new Set(['.tsx', '.jsx'])

const violacoes: Violacao[] = []
const vistas = new Set<string>()
let lidos = 0
let ignorados = 0

function listar(pasta: string): string[] {
  const saida: string[] = []
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = path.join(pasta, entrada.name)
    if (entrada.isDirectory()) saida.push(...listar(caminho))
    else if (entrada.isFile()) saida.push(caminho)
  }
  return saida
}

function relativo(arquivo: string): string {
  return path.relative(RAIZ, arquivo).split(path.sep).join('/')
}

/** Troca comentários por espaços, mantendo posições e quebras de linha (strings ficam intactas). */
function semComentariosJs(fonte: string): string {
  let saida = ''
  let estado: 'codigo' | 'linha' | 'bloco' | "'" | '"' | '`' = 'codigo'
  for (let i = 0; i < fonte.length; i++) {
    const c = fonte[i]
    const d = fonte[i + 1]
    if (estado === 'codigo') {
      if (c === '/' && d === '/') {
        estado = 'linha'
        saida += '  '
        i++
        continue
      }
      if (c === '/' && d === '*') {
        estado = 'bloco'
        saida += '  '
        i++
        continue
      }
      if (c === "'" || c === '"' || c === '`') estado = c
      saida += c
      continue
    }
    if (estado === 'linha') {
      if (c === '\n') {
        estado = 'codigo'
        saida += c
      } else saida += ' '
      continue
    }
    if (estado === 'bloco') {
      if (c === '*' && d === '/') {
        estado = 'codigo'
        saida += '  '
        i++
        continue
      }
      saida += c === '\n' ? '\n' : ' '
      continue
    }
    // Dentro de string. Uma quebra de linha encerra aspas simples/duplas (apóstrofo em texto JSX).
    if (c === '\\' && d !== undefined && d !== '\n') {
      saida += c + d
      i++
      continue
    }
    if (c === estado || (c === '\n' && estado !== '`')) estado = 'codigo'
    saida += c
  }
  return saida
}

function semComentariosCss(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, ' '))
}

function semComentarios(fonte: string, ext: string): string {
  if (EXT_CODIGO.has(ext)) return semComentariosJs(fonte)
  if (ext === '.css') return semComentariosCss(fonte)
  return fonte
}

function criarLocalizador(fonte: string): (indice: number) => number {
  const inicios = [0]
  for (let i = 0; i < fonte.length; i++) if (fonte[i] === '\n') inicios.push(i + 1)
  return (indice) => {
    let baixo = 0
    let alto = inicios.length - 1
    while (baixo < alto) {
      const meio = (baixo + alto + 1) >> 1
      if (inicios[meio] <= indice) baixo = meio
      else alto = meio - 1
    }
    return baixo + 1
  }
}

function registrar(
  criterio: Violacao['criterio'],
  arquivo: string,
  fonte: string,
  linha: number,
  mensagem: string,
): void {
  const chave = `${relativo(arquivo)}:${linha}:${mensagem}`
  if (vistas.has(chave)) return
  vistas.add(chave)
  const trecho = (fonte.split('\n')[linha - 1] ?? '').trim().slice(0, 140)
  violacoes.push({ criterio, arquivo: relativo(arquivo), linha, mensagem, trecho })
}

function checarLib(arquivo: string, fonte: string, local: (i: number) => number): void {
  const ext = path.extname(arquivo)
  if (ext === '.css' || ext === '.tsx') registrar('G21', arquivo, fonte, 1, `lib/ não pode ter arquivo ${ext}`)
  for (const achado of fonte.matchAll(/className/g)) {
    registrar('G21', arquivo, fonte, local(achado.index), 'lib/ não pode conter "className"')
  }
}

const FONTE_PROIBIDA = /\b(Inter|Roboto|Arial)\b/i
const MONOESPACADA = /\bmonospace\b/i
// Linhas em que um nome de família é de fato uma fonte (CSS, estilo inline, canvas, FontFace, tokens).
const CONTEXTO_FONTE: RegExp[] = [
  /font-family\s*:/i,
  /fontFamily/,
  /\.font\s*=/,
  /(^|[^\w-])font\s*:/,
  /\bfont-\[/,
  /--font-[\w-]+\s*:/,
  /\bfamily\s*:/,
  /new\s+FontFace\s*\(/,
  /['"`][^'"`\n]*\b\d+(?:\.\d+)?(?:px|pt|r?em)\b[^'"`\n]*['"`]/,
]

function checarFontes(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  // Imports de next/font (podem ocupar várias linhas).
  for (const achado of limpo.matchAll(/\bimport\s+((?:type\s+)?[^'";]*?)\s+from\s*['"]next\/font\/(?:google|local)['"]/g)) {
    const nomes = achado[1].replace(/_/g, ' ')
    const proibida = nomes.match(FONTE_PROIBIDA)
    if (proibida) registrar('G22', arquivo, fonte, local(achado.index), `fonte proibida "${proibida[1]}" importada de next/font`)
  }
  const linhas = limpo.split('\n')
  linhas.forEach((linha, i) => {
    if (!CONTEXTO_FONTE.some((padrao) => padrao.test(linha))) return
    const proibida = linha.match(FONTE_PROIBIDA)
    if (proibida) registrar('G22', arquivo, fonte, i + 1, `fonte proibida "${proibida[1]}"`)
    if (MONOESPACADA.test(linha)) registrar('G22', arquivo, fonte, i + 1, 'fonte monoespaçada')
  })
  for (const achado of limpo.matchAll(/\bfont-mono\b/g)) {
    registrar('G22', arquivo, fonte, local(achado.index), '"font-mono" é proibido')
  }
}

function checarSeta(arquivo: string, fonte: string, texto: string, local: (i: number) => number): void {
  for (const achado of texto.matchAll(/→|&rarr;|\\u2192|\\u\{2192\}|&#8594;|&#x2192;/gi)) {
    registrar('G22', arquivo, fonte, local(achado.index), '"→" é proibido')
  }
}

/** Lê o texto de `className=` a partir de `inicio` (string literal ou expressão entre chaves). */
function lerExpressao(limpo: string, inicio: number): string {
  const abertura = limpo[inicio]
  if (abertura === '"' || abertura === "'") {
    const fim = limpo.indexOf(abertura, inicio + 1)
    return limpo.slice(inicio + 1, fim === -1 ? undefined : fim)
  }
  if (abertura !== '{') return ''
  let nivel = 0
  for (let i = inicio; i < limpo.length; i++) {
    if (limpo[i] === '{') nivel++
    else if (limpo[i] === '}') {
      nivel--
      if (nivel === 0) return limpo.slice(inicio, i + 1)
    }
  }
  return limpo.slice(inicio)
}

function checarCaixaAlta(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  const ext = path.extname(arquivo)
  if (EXT_CODIGO.has(ext)) {
    for (const achado of limpo.matchAll(/\bclassName\s*=\s*/g)) {
      const expressao = lerExpressao(limpo, achado.index + achado[0].length)
      if (/\buppercase\b/.test(expressao) && /\btracking-/.test(expressao)) {
        registrar('G22', arquivo, fonte, local(achado.index), '"uppercase" com "tracking-" na mesma className')
      }
    }
    for (const achado of limpo.matchAll(/\bstyle\s*=\s*\{/g)) {
      const expressao = lerExpressao(limpo, achado.index + achado[0].length - 1)
      if (/textTransform\s*:\s*['"`]uppercase/.test(expressao) && /letterSpacing\s*:/.test(expressao)) {
        registrar('G22', arquivo, fonte, local(achado.index), 'caixa alta com letterSpacing no mesmo estilo inline')
      }
    }
  }
  if (ext === '.css') {
    for (const achado of limpo.matchAll(/\{[^{}]*\}/g)) {
      const bloco = achado[0]
      const apply = /@apply[^;]*\buppercase\b[^;]*\btracking-|@apply[^;]*\btracking-[^;]*\buppercase\b/.test(bloco)
      const declarado = /text-transform\s*:\s*uppercase/i.test(bloco) && /letter-spacing\s*:/i.test(bloco)
      if (apply || declarado) registrar('G22', arquivo, fonte, local(achado.index), 'caixa alta com espaçamento de letras na mesma regra')
    }
  }
}

function checarNumeracao(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  const ext = path.extname(arquivo)
  if (EXT_JSX.has(ext)) {
    for (const achado of limpo.matchAll(/>([^<>{}]+)</g)) {
      if (/(^|[\s(])0[1-9](?=$|[\s.):\-–—])/.test(achado[1])) {
        registrar('G22', arquivo, fonte, local(achado.index), 'numeração 01/02/03 em texto visível')
      }
    }
  }
  if (EXT_CODIGO.has(ext)) {
    for (const achado of limpo.matchAll(/(['"`])0[1-9](?:[\s.):\-–—][^'"`\n]*)?\1|`0\$\{/g)) {
      registrar('G22', arquivo, fonte, local(achado.index), 'numeração 01/02/03 em texto')
    }
  }
  if (ext === '.css') {
    for (const achado of limpo.matchAll(/content\s*:\s*['"]0[1-9]|decimal-leading-zero/gi)) {
      registrar('G22', arquivo, fonte, local(achado.index), 'numeração 01/02/03 gerada por CSS')
    }
  }
}

function checarPontoMedio(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  for (const achado of limpo.matchAll(/·|&middot;|\\u00b7|\\u\{b7\}|&#183;|&#xb7;/gi)) {
    registrar('G22', arquivo, fonte, local(achado.index), 'ponto médio "·" em texto')
  }
}


const LITERAIS_DE_COR: { padrao: RegExp; mensagem: string }[] = [
  { padrao: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g, mensagem: 'cor hexadecimal' },
  { padrao: /\b0x[0-9a-fA-F]{6}\b/g, mensagem: 'cor 0xRRGGBB' },
  { padrao: /\b(?:rgba?|hsla?)\(/g, mensagem: 'cor rgb()/hsl()' },
  { padrao: /\bnew\s+Color\(\s*['"`]/g, mensagem: 'new Color com string' },
]

function checarCores(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  if (relativo(arquivo) === TOKENS) return
  for (const { padrao, mensagem } of LITERAIS_DE_COR) {
    for (const achado of limpo.matchAll(padrao)) {
      // Âncora interna (href="#...") não é cor.
      if (/href\s*=\s*\{?\s*["'`]$/.test(limpo.slice(Math.max(0, achado.index - 12), achado.index))) continue
      registrar('G26', arquivo, fonte, local(achado.index), `${mensagem} fora de ${TOKENS}`)
    }
  }
}

function checar(arquivo: string): void {
  const ext = path.extname(arquivo).toLowerCase()
  if (!EXT_TEXTO.has(ext)) {
    ignorados++
    return
  }
  lidos++
  const fonte = readFileSync(arquivo, 'utf8')
  const limpo = semComentarios(fonte, ext)
  const local = criarLocalizador(fonte)
  const naLib = !path.relative(LIB, arquivo).startsWith('..')
  const excecao = EXCECOES[relativo(arquivo)] ?? {}
  if (naLib) checarLib(arquivo, fonte, local)
  if (!excecao.fontes) checarFontes(arquivo, fonte, limpo, local)
  // Em app/ e componentes/ o "→" é proibido em qualquer lugar (até em comentário); em lib/ só fora de comentários.
  checarSeta(arquivo, fonte, naLib ? limpo : fonte, local)
  checarCaixaAlta(arquivo, fonte, limpo, local)
  checarNumeracao(arquivo, fonte, limpo, local)
  checarPontoMedio(arquivo, fonte, limpo, local)
  if (!excecao.cores) checarCores(arquivo, fonte, limpo, local)
}

for (const pasta of PASTAS_DO_SITE) for (const arquivo of listar(path.join(RAIZ, pasta))) checar(arquivo)

const pastas = PASTAS_DO_SITE.map((pasta) => `${pasta}/`).join(', ')
console.log(`checar-padroes: ${lidos} arquivos lidos em ${pastas} (${ignorados} binários ignorados)`)
for (const [arquivo, { fontes, cores }] of Object.entries(EXCECOES)) {
  const regras = [fontes && 'fontes do G22', cores && 'G26'].filter(Boolean).join(' e ')
  console.log(`Exceção: ${arquivo} fica fora de ${regras}.`)
}
if (violacoes.length === 0) {
  console.log('G21, G22 e G26: nenhuma violação.')
} else {
  violacoes.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha)
  for (const v of violacoes) {
    console.log(`${v.criterio}  ${v.arquivo}:${v.linha}  ${v.mensagem}`)
    if (v.trecho) console.log(`      ${v.trecho}`)
  }
  const total = (criterio: Violacao['criterio']) => violacoes.filter((v) => v.criterio === criterio).length
  console.log(`\n${violacoes.length} violação(ões): G21 ${total('G21')}, G22 ${total('G22')}, G26 ${total('G26')}.`)
  process.exitCode = 1
}
