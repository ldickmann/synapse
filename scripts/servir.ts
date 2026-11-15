// O `pnpm start`: serve a exportação estática (out/) como o Cloudflare Pages, para os testes, as capturas e o
// Lighthouse medirem a mesma pasta que vai para o ar. O `next start` não serve a exportação (docs/decisoes/0002).
// Uso: pnpm build && pnpm start [--port N | -p N]   (ou PORT=N; padrão 3000)
// Do Pages, repete: o Cache-Control padrão, as regras de out/_headers e o 404.html (sem ele, o index.html em qualquer
// caminho, como numa SPA). Comprime com gzip, como o next start; o brotli e os redirects de .html do Pages só se
// conferem no preview.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const RAIZ = path.resolve(import.meta.dirname, '..')
const PASTA = path.join(RAIZ, 'out')
const PAGINA_404 = path.join(PASTA, '404.html')

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}
const COMPRIMIVEIS = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt'])
// O compression do next start não comprime abaixo de 1 KiB; o mesmo limite deixa o G10 comparável.
const MINIMO_PARA_COMPRIMIR = 1024
// Padrão do Cloudflare Pages para o que o _headers não muda.
const CACHE_PADRAO = 'public, max-age=0, must-revalidate'
// Configuração do Pages na raiz da pasta: ele lê e não serve.
const RESERVADOS = new Set(['_headers', '_redirects'])

type Regra = { padrao: RegExp; poe: [string, string][]; tira: string[] }

function lerPorta(args: string[]): number {
  let valor = process.env.PORT ?? '3000'
  args.forEach((arg, i) => {
    if (arg === '--port' || arg === '-p') valor = args[i + 1] ?? ''
    else if (arg.startsWith('--port=')) valor = arg.slice('--port='.length)
  })
  const porta = Number(valor)
  if (valor === '' || !Number.isInteger(porta) || porta < 0 || porta > 65535) {
    console.error(`Porta inválida: "${valor}".`)
    process.exit(1)
  }
  return porta
}

/** Padrão de caminho do _headers em regex: `*` casa qualquer trecho, e `:nome`, um segmento. */
function paraRegex(padrao: string): RegExp {
  const corpo = padrao
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((parte, i) => (i % 2 === 0 ? parte.replace(/[.+?^${}()|[\]\\]/g, '\\$&') : parte === '*' ? '.*' : '[^/]+'))
    .join('')
  return new RegExp(`^${corpo}$`)
}

/** Regras de out/_headers: `Nome: valor` põe e `! Nome` tira. Padrão com host (https://…) só vale no Pages. */
function lerRegras(): Regra[] {
  const arquivo = path.join(PASTA, '_headers')
  if (!existsSync(arquivo)) return []
  const regras: Regra[] = []
  let atual: Regra | null = null
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const texto = linha.trim()
    if (texto === '' || texto.startsWith('#')) continue
    if (!/^\s/.test(linha)) {
      atual = /^(?:https?:)?\/\//.test(texto) ? null : { padrao: paraRegex(texto), poe: [], tira: [] }
      if (atual) regras.push(atual)
    } else if (atual && texto.startsWith('!')) {
      atual.tira.push(texto.slice(1).trim().toLowerCase())
    } else if (atual && texto.indexOf(':') > 0) {
      const separador = texto.indexOf(':')
      atual.poe.push([texto.slice(0, separador).trim().toLowerCase(), texto.slice(separador + 1).trim()])
    }
  }
  return regras
}

/** O tipo, o cache padrão do Pages e, por cima, as regras do _headers que casam com o caminho pedido. */
function cabecalhosDe(caminho: string, extensao: string): Record<string, string> {
  const lista: Record<string, string> = {
    'content-type': TIPOS[extensao] ?? 'application/octet-stream',
    'cache-control': CACHE_PADRAO,
  }
  const postos = new Set<string>()
  const tirados: string[] = []
  for (const regra of REGRAS.filter((r) => r.padrao.test(caminho))) {
    for (const [nome, valor] of regra.poe) {
      // O mesmo cabeçalho em duas regras junta os valores com vírgula, como no Pages.
      lista[nome] = postos.has(nome) ? `${lista[nome]}, ${valor}` : valor
      postos.add(nome)
    }
    tirados.push(...regra.tira)
  }
  for (const nome of tirados) delete lista[nome]
  return lista
}

/** Arquivo de out/ para o caminho, na ordem do Pages: exato, <caminho>.html e <caminho>/index.html. */
function arquivoDe(caminho: string): string | null {
  if (caminho.includes('\0')) return null
  const base = path.resolve(PASTA, `.${caminho}`)
  // Caminho que sai de out/ (com ..) não é servido.
  if (base !== PASTA && !base.startsWith(PASTA + path.sep)) return null
  if (RESERVADOS.has(path.relative(PASTA, base))) return null
  const candidatos = caminho.endsWith('/')
    ? [path.join(base, 'index.html')]
    : [base, `${base}.html`, path.join(base, 'index.html')]
  return candidatos.find((candidato) => existsSync(candidato) && statSync(candidato).isFile()) ?? null
}

function aceitaGzip(pedido: IncomingMessage): boolean {
  return String(pedido.headers['accept-encoding'] ?? '')
    .split(',')
    .some((item) => {
      const [nome, ...parametros] = item.split(';').map((parte) => parte.trim().toLowerCase())
      return (nome === 'gzip' || nome === '*') && !parametros.some((p) => /^q=0(?:\.0*)?$/.test(p))
    })
}

const comprimidos = new Map<string, Buffer>()

/** gzip no nível padrão, o mesmo do next start, guardado em memória enquanto o arquivo não muda. */
function comprimir(arquivo: string, corpo: Buffer): Buffer {
  const chave = `${arquivo}:${statSync(arquivo).mtimeMs}`
  const guardado = comprimidos.get(chave) ?? gzipSync(corpo)
  comprimidos.set(chave, guardado)
  return guardado
}

function responder(pedido: IncomingMessage, resposta: ServerResponse): void {
  if (pedido.method !== 'GET' && pedido.method !== 'HEAD') {
    resposta.writeHead(405, { allow: 'GET, HEAD' }).end()
    return
  }
  let caminho: string
  try {
    caminho = decodeURIComponent(new URL(pedido.url ?? '/', 'http://localhost').pathname)
  } catch {
    resposta.writeHead(400).end()
    return
  }
  let arquivo = arquivoDe(caminho)
  let status = 200
  if (!arquivo) {
    // Sem 404.html, o Pages trata o site como SPA e serve o index.html, com 200, em qualquer caminho.
    status = existsSync(PAGINA_404) ? 404 : 200
    arquivo = status === 404 ? PAGINA_404 : path.join(PASTA, 'index.html')
  }
  const extensao = path.extname(arquivo)
  const cabecalhos = cabecalhosDe(caminho, extensao)
  let corpo: Buffer = readFileSync(arquivo)
  if (COMPRIMIVEIS.has(extensao)) {
    cabecalhos.vary = 'Accept-Encoding'
    if (corpo.length >= MINIMO_PARA_COMPRIMIR && aceitaGzip(pedido)) {
      corpo = comprimir(arquivo, corpo)
      cabecalhos['content-encoding'] = 'gzip'
    }
  }
  cabecalhos['content-length'] = String(corpo.length)
  resposta.writeHead(status, cabecalhos)
  resposta.end(pedido.method === 'HEAD' ? undefined : corpo)
}

if (!existsSync(PASTA)) {
  console.error(`Não há a pasta ${path.relative(RAIZ, PASTA)}/. Rode antes: pnpm build`)
  process.exit(1)
}
const PORTA = lerPorta(process.argv.slice(2))
const REGRAS = lerRegras()

const servidor = createServer((pedido, resposta) => {
  try {
    responder(pedido, resposta)
  } catch (erro) {
    console.error(erro)
    if (!resposta.headersSent) resposta.writeHead(500)
    resposta.end()
  }
})
servidor.on('error', (erro: NodeJS.ErrnoException) => {
  console.error(erro.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso.` : erro.message)
  process.exit(1)
})
// Sem host, o Node escuta em todas as interfaces, e o localhost responde em IPv4 e em IPv6.
servidor.listen(PORTA, () => {
  console.log(`Servindo ${path.relative(RAIZ, PASTA)}/ em http://localhost:${PORTA}`)
})
