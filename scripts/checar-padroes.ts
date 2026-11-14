// G21, G22 (SPEC §8.1) e G26 (SPEC §11): isolamento entre estilos, padrões proibidos e literais de cor, por leitura dos arquivos.
// Uso: node scripts/checar-padroes.ts  (sai com 1 se houver violação)
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

type Violacao = { criterio: 'G21' | 'G22' | 'G26'; arquivo: string; linha: number; mensagem: string; trecho: string }

const RAIZ = path.resolve(import.meta.dirname, '..')
const APP = path.join(RAIZ, 'app')
const LIB = path.join(RAIZ, 'lib')
const ESTILOS = ['mesa', 'sinapse']
// Rotas de exploração (SPEC §11): cor só em tokens.css (G26).
const ESTILOS_G26 = ['sinapse']
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

/** Estilo dono do arquivo (`app/<estilo>/...`) ou null. */
function estiloDe(arquivo: string): string | null {
  const partes = path.relative(APP, arquivo).split(path.sep)
  if (partes.length < 2 || partes[0] === '..') return null
  return ESTILOS.includes(partes[0]) ? partes[0] : null
}

/** Para onde um especificador de import aponta dentro de app/ (nome do estilo) ou null. */
function estiloImportado(arquivo: string, especificador: string): string | null {
  let destino: string | null = null
  if (especificador.startsWith('.')) destino = path.resolve(path.dirname(arquivo), especificador)
  else if (especificador.startsWith('@/')) destino = path.join(RAIZ, especificador.slice(2))
  if (destino === null) return null
  const partes = path.relative(APP, destino).split(path.sep)
  if (partes[0] === '..' || partes[0] === '') return null
  return ESTILOS.includes(partes[0]) ? partes[0] : null
}

const PADROES_IMPORT: RegExp[] = [
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@(?:import|source|reference|plugin|config)\s+(?:not\s+)?(?:url\(\s*)?['"]?([^'")\s;]+)/g,
  /\burl\(\s*['"]?([^'")\s]+)/g,
]

function checarIsolamento(arquivo: string, fonte: string, limpo: string, local: (i: number) => number): void {
  const proprio = estiloDe(arquivo)
  if (proprio === null) return
  for (const padrao of PADROES_IMPORT) {
    for (const achado of limpo.matchAll(padrao)) {
      const especificador = achado[1]
      const outro = estiloImportado(arquivo, especificador)
      if (outro !== null && outro !== proprio) {
        registrar('G21', arquivo, fonte, local(achado.index), `app/${proprio} importa de app/${outro} ("${especificador}")`)
      }
    }
  }
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
  const estilo = estiloDe(arquivo)
  if (estilo === null || !ESTILOS_G26.includes(estilo) || path.basename(arquivo) === 'tokens.css') return
  for (const { padrao, mensagem } of LITERAIS_DE_COR) {
    for (const achado of limpo.matchAll(padrao)) {
      // Âncora interna (href="#...") não é cor.
      if (/href\s*=\s*\{?\s*["'`]$/.test(limpo.slice(Math.max(0, achado.index - 12), achado.index))) continue
      registrar('G26', arquivo, fonte, local(achado.index), `${mensagem} fora de tokens.css`)
    }
  }
}

function checar(arquivo: string, naLib: boolean): void {
  const ext = path.extname(arquivo).toLowerCase()
  if (!EXT_TEXTO.has(ext)) {
    ignorados++
    return
  }
  lidos++
  const fonte = readFileSync(arquivo, 'utf8')
  const limpo = semComentarios(fonte, ext)
  const local = criarLocalizador(fonte)
  if (naLib) checarLib(arquivo, fonte, local)
  else checarIsolamento(arquivo, fonte, limpo, local)
  checarFontes(arquivo, fonte, limpo, local)
  // Em app/ o "→" é proibido em qualquer lugar (até em comentário); em lib/ só fora de comentários.
  checarSeta(arquivo, fonte, naLib ? limpo : fonte, local)
  checarCaixaAlta(arquivo, fonte, limpo, local)
  checarNumeracao(arquivo, fonte, limpo, local)
  checarPontoMedio(arquivo, fonte, limpo, local)
  if (!naLib) checarCores(arquivo, fonte, limpo, local)
}

for (const arquivo of listar(APP)) checar(arquivo, false)
for (const arquivo of listar(LIB)) checar(arquivo, true)

console.log(`checar-padroes: ${lidos} arquivos lidos em app/ e lib/ (${ignorados} binários ignorados, ex.: og/*.ttf)`)
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
