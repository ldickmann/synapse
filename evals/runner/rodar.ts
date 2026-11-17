// O runner das evals. Uma tentativa por vez, cada uma num workspace novo a partir do commit base (evals/README.md).
//
//   node evals/runner/rodar.ts --sem-modelo [--sem-juiz] [--casos a,b] [--variantes referencia,quebrada,nula]
//       Sem agente: aplica referencia.patch, quebrada.patch e nenhuma mudança (a tentativa nula) e roda os
//       avaliadores. A referência passa em tudo, a quebrada reprova no comportamento e a nula, em pedido-cumprido.
//   node evals/runner/rodar.ts --sonda [--casos <id>]
//       Uma tentativa com Haiku, para conferir no system/init o que carregou e perguntar ao agente que instruções
//       de projeto recebeu.
//   node evals/runner/rodar.ts --nome <nome> [--conjunto ajuste|validacao|todos] [--casos a,b] [--tentativas N]
//       [--teto USD] [--harness <patch>] [--hipotese "…"] [--manter]
//       Uma rodada: os casos × N tentativas com o agente, registrada em experimentos/<data>-<nome>/.
//   node evals/runner/rodar.ts --retomar <pasta do experimento>
//       Continua uma rodada que parou: só as tentativas que faltam ou que não rodaram.
//
// O detalhe dos casos de validação fica em validacao/experimentos/<data>-<nome>/: a sessão que ajusta o harness
// não lê validacao/, e o relatório de experimentos/ só traz os números deles.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { AVALIADORES, avaliadoresDoCaso } from '../avaliadores/index.ts'
import { montarContexto, type ResultadoDoAvaliador } from '../avaliadores/contexto.ts'
import { localizarClaude, rodarAgente, versaoDoClaude, type Evento, type ResultadoDoAgente } from './agente.ts'
import {
  dataLocal,
  escreverJson,
  git,
  gitOk,
  LOCAL,
  lerArgumentos,
  lerCasos,
  lerJson,
  lerSuite,
  lerToken,
  naFaixa,
  portasEmEscuta,
  RAIZ,
  rotuloLocal,
  sha256,
  VARIAVEL_DO_TOKEN,
  type Caso,
  type Suite,
} from './comum.ts'
import { criarJuiz, JuizNaoRodou, type Juiz } from './juiz.ts'
import {
  conferirVariante,
  lerRegistros,
  pastasDoExperimento,
  PASTA_EXPERIMENTOS,
  statusPelosAvaliadores,
  textoDosLimites,
  type Experimento,
  type Modo,
  type Registro,
  type Resultados,
  type ResumoDoAgente,
  type Variante,
} from './registro.ts'
import { escreverRelatorios } from './relatorio.ts'
import { apagarWorkspace, aplicarVariante, criarWorkspace, lerPatch, type Workspace } from './workspace.ts'

class Parada extends Error {}

function agora(): string {
  return new Date().toISOString()
}

function criarLog(arquivo: string): (mensagem: string) => void {
  mkdirSync(path.dirname(arquivo), { recursive: true })
  return (mensagem) => {
    const linha = `[${new Date().toLocaleTimeString('pt-BR')}] ${mensagem}`
    console.log(linha)
    writeFileSync(arquivo, `${linha}\n`, { flag: 'a' })
  }
}

/** Lê de novo os eventos de uma transcrição gravada, para reavaliar uma tentativa. */
function lerEventos(transcricao: string): Evento[] {
  const arquivo = transcricao.replace('%LOCALAPPDATA%\\synapse-evals', LOCAL)
  if (!existsSync(arquivo)) return []
  return readFileSync(arquivo, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((linha) => {
      try {
        return JSON.parse(linha) as Evento
      } catch {
        return { type: 'texto-solto', texto: linha }
      }
    })
}

type Estado = {
  suite: Suite
  exp: Experimento
  dirExp: string
  dirVal: string
  registros: Registro[]
  casos: Map<string, Caso>
  log: (mensagem: string) => void
  juiz: Juiz | null
  token: string | null
  harnessPatch: string
  cache: Map<string, ResultadoDoAvaliador>
  copiaDoLucas: string
}

/** Grava experimento.json e resultados.json, separando o detalhe da validação. */
async function salvar(e: Estado): Promise<void> {
  await escreverJson(path.join(e.dirExp, 'experimento.json'), e.exp)
  const ajuste = e.registros.filter((r) => r.conjunto === 'ajuste')
  const validacao = e.registros.filter((r) => r.conjunto === 'validacao')
  await escreverJson(path.join(e.dirExp, 'resultados.json'), { tentativas: ajuste } satisfies Resultados)
  if (validacao.length)
    await escreverJson(path.join(e.dirVal, 'resultados.json'), { tentativas: validacao } satisfies Resultados)
}

function custoGasto(e: Estado): number {
  return e.registros.reduce((soma, r) => soma + (r.agente?.custoUsd ?? 0) + r.juiz.custoUsd, 0)
}

/** O estado da cópia de trabalho do Lucas, sem as pastas que esta rodada escreve. */
function fotoDaCopia(e: Pick<Estado, 'dirExp' | 'dirVal'>): string {
  const fora = [e.dirExp, e.dirVal].map((d) => `:(exclude)${path.relative(RAIZ, d).replaceAll('\\', '/')}`)
  const status = gitOk(['status', '--porcelain', '--', '.', ...fora], RAIZ)
  return `${gitOk(['rev-parse', 'HEAD'], RAIZ)}\n${status}`
}

function conferirPortasLivres(suite: Suite): void {
  const ocupadas = portasEmEscuta().filter(
    (p) => naFaixa(p.porta, suite.portas.agente) || p.porta === suite.portas.avaliador,
  )
  if (ocupadas.length) {
    throw new Parada(
      `Portas ocupadas antes de começar: ${ocupadas.map((p) => `${p.porta} (pid ${p.pid})`).join(', ')}. Feche o servidor e rode de novo.`,
    )
  }
}

/** O caminho do diff de uma tentativa, gravado ao lado dos resultados do conjunto dela. */
function gravarDiff(e: Estado, registro: Registro, ws: Workspace): string {
  const pasta = registro.conjunto === 'validacao' ? e.dirVal : e.dirExp
  const nome = `${registro.id.replace(/[#@]/g, '-')}.diff`
  const diff = git(['diff', '--no-color', registro.inicio, registro.final], ws.repo).saida
  mkdirSync(path.join(pasta, 'diffs'), { recursive: true })
  writeFileSync(path.join(pasta, 'diffs', nome), diff ? `${diff}\n` : '')
  return `diffs/${nome}`
}

async function avaliar(
  e: Estado,
  caso: Caso,
  ws: Workspace,
  agente: ResultadoDoAgente | null,
): Promise<{
  avaliadores: Record<string, ResultadoDoAvaliador>
  inicio: string
  final: string
  juiz: Registro['juiz']
}> {
  const custoAntes = e.juiz?.custoUsd() ?? 0
  const chamadasAntes = e.juiz?.chamadas() ?? 0
  const ctx = montarContexto({ caso, suite: e.suite, ws, agente, juiz: e.juiz, cache: e.cache, log: e.log })
  const resultados: Record<string, ResultadoDoAvaliador> = {}
  for (const avaliador of avaliadoresDoCaso(caso.avaliadores)) {
    e.log(`${caso.id}: ${avaliador.nome}`)
    try {
      resultados[avaliador.nome] = await avaliador.avaliar(ctx)
    } catch (erro) {
      if (erro instanceof JuizNaoRodou) throw erro
      resultados[avaliador.nome] = { status: 'nao-rodou', resumo: `erro no avaliador: ${String(erro).slice(0, 500)}` }
      e.log(`${caso.id}: ${avaliador.nome} deu erro: ${String(erro)}`)
    }
    e.log(
      `${caso.id}: ${avaliador.nome} → ${resultados[avaliador.nome].status}: ${resultados[avaliador.nome].resumo.slice(0, 200)}`,
    )
  }
  return {
    avaliadores: resultados,
    inicio: ctx.inicio,
    final: ctx.final,
    juiz: { custoUsd: (e.juiz?.custoUsd() ?? 0) - custoAntes, chamadas: (e.juiz?.chamadas() ?? 0) - chamadasAntes },
  }
}

/** O resultado do agente sem os eventos, que ficam na transcrição; com a última mensagem dele, o aviso final. */
function resumirAgente(agente: ResultadoDoAgente, transcricao: string): ResumoDoAgente {
  const resumo: Partial<ResultadoDoAgente> = { ...agente }
  delete resumo.eventos
  const mensagemFinal = String(agente.eventos.filter((ev) => ev.type === 'result').at(-1)?.result ?? '')
  return {
    ...(resumo as Omit<ResultadoDoAgente, 'eventos'>),
    transcricao: rotuloLocal(transcricao),
    mensagemFinal: mensagemFinal.slice(0, 6000),
  }
}

const HIPOTESE_PADRAO: Record<Modo, string> = {
  'sem-modelo': 'Sem agente: os avaliadores na referência, na versão quebrada e na tentativa nula de cada caso.',
  sonda: 'Sonda de isolamento: uma tentativa com Haiku, para ver no system/init o que carregou.',
  rodada: 'Linha de base: o harness do commit base, sem mudança.',
}

/** Pedido da sonda: o do caso, mais a pergunta sobre as instruções que o agente recebeu. */
const PERGUNTA_DA_SONDA =
  'No fim, numa lista curta, diga que instruções de projeto você recebeu nesta sessão (arquivos CLAUDE.md, rules, skills e hooks) e de onde veio cada uma.'

async function rodarTentativa(e: Estado, caso: Caso, n: number): Promise<void> {
  const id = `${caso.id}#${n}`
  const custo = custoGasto(e)
  const reserva = e.exp.teto_tentativa_usd + (e.juiz ? e.suite.estimativa_juiz_tentativa_usd : 0)
  if (custo + reserva > e.exp.orcamento_rodada_usd) {
    throw new Parada(
      `orçamento da rodada: US$ ${custo.toFixed(2)} gastos + US$ ${reserva.toFixed(2)} da próxima tentativa passariam de US$ ${e.exp.orcamento_rodada_usd}`,
    )
  }
  conferirPortasLivres(e.suite)
  e.log(`== ${id} (gasto até aqui: US$ ${custo.toFixed(2)})`)
  const ws = await criarWorkspace({
    suite: e.suite,
    harnessPatch: e.harnessPatch,
    preparo: lerPatch(caso.pasta, 'preparo.patch'),
    log: e.log,
  })
  const transcricao = path.join(LOCAL, 'transcricoes', path.basename(e.dirExp), caso.conjunto, `${caso.id}-${n}.jsonl`)
  const pedido = e.exp.modo === 'sonda' ? `${caso.pedido}\n\n${PERGUNTA_DA_SONDA}` : caso.pedido
  const agente = await rodarAgente({
    suite: e.suite,
    ws,
    pedido,
    modelo: e.exp.agente.modelo,
    esforco: e.exp.agente.esforco,
    tetoUsd: e.exp.teto_tentativa_usd,
    token: e.token ?? '',
    transcricao,
    skillsEsperadas: ['verificar'],
    log: e.log,
  })
  const resumo = resumirAgente(agente, transcricao)
  e.log(
    `${id}: agente ${agente.status} (${agente.fim}), US$ ${agente.custoUsd.toFixed(2)}, ${agente.turnos ?? '?'} turnos, ${agente.duracaoS} s${textoDosLimites(agente.limites)}`,
  )
  const registro: Registro = {
    id,
    caso: caso.id,
    conjunto: caso.conjunto,
    tipo: caso.tipo,
    n,
    variante: null,
    status: 'avaliacao-pendente',
    confere: null,
    avaliadores: {},
    agente: resumo,
    juiz: { custoUsd: 0, chamadas: 0 },
    marcas: [],
    workspace: ws.pasta,
    inicio: ws.inicio,
    final: '',
    diff: null,
    quando: agora(),
  }
  e.registros = e.registros.filter((r) => r.id !== id)
  e.registros.push(registro)
  if (agente.portasDeFora.length) {
    await salvar(e)
    throw new Parada(
      `porta ocupada por processo que não é da tentativa: ${agente.portasDeFora.map((p) => `${p.porta} (pid ${p.pid})`).join(', ')}`,
    )
  }
  if (agente.status === 'nao-rodou') {
    registro.status = 'nao-rodou'
    await salvar(e)
    throw new Parada(`${id} não rodou (${agente.fim}): ${agente.stderr.slice(-500)}`)
  }
  if (e.exp.modo === 'rodada' && (!agente.init || agente.init.problemas.length)) {
    registro.status = 'nao-rodou'
    registro.marcas.push(`init: ${agente.init?.problemas.join('; ') ?? 'sem evento system/init'}`)
    await salvar(e)
    throw new Parada(`o system/init de ${id} não confere: ${registro.marcas.at(-1)}`)
  }
  await avaliarERegistrar(e, caso, ws, agente, registro)
}

async function avaliarERegistrar(
  e: Estado,
  caso: Caso,
  ws: Workspace,
  agente: ResultadoDoAgente | null,
  registro: Registro,
): Promise<void> {
  const avaliacao = await avaliar(e, caso, ws, agente)
  registro.avaliadores = avaliacao.avaliadores
  registro.inicio = avaliacao.inicio
  registro.final = avaliacao.final
  registro.juiz = avaliacao.juiz
  registro.diff = gravarDiff(e, registro, ws)
  registro.marcas = [
    ...((avaliacao.avaliadores.transcricao?.detalhes as { marcas?: string[] } | undefined)?.marcas ?? []),
  ]
  if (agente?.init?.problemas.length) registro.marcas.push(`init: ${agente.init.problemas.join('; ')}`)
  const pendente = Object.values(avaliacao.avaliadores).some(
    (r) => r.status === 'nao-rodou' && /rede|porta/.test(r.resumo),
  )
  if (registro.variante) {
    registro.confere = conferirVariante(caso, registro.variante, avaliacao.avaliadores)
    registro.status = statusPelosAvaliadores(caso, avaliacao.avaliadores)
  } else if (pendente) {
    registro.status = 'avaliacao-pendente'
  } else if (agente?.status === 'corte' || agente?.status === 'tempo-esgotado') {
    registro.status = agente.status
  } else {
    registro.status = statusPelosAvaliadores(caso, avaliacao.avaliadores)
  }
  const manter = e.exp.manter || registro.status === 'avaliacao-pendente'
  registro.workspace = manter ? ws.pasta : null
  await salvar(e)
  e.log(`${registro.id}: ${registro.status}${registro.confere ? ` (confere: ${registro.confere})` : ''}`)
  if (!manter) apagarWorkspace(ws)
  if (fotoDaCopia(e) !== e.copiaDoLucas) {
    throw new Parada('A cópia de trabalho do Lucas mudou durante a rodada (HEAD ou git status). Pare e confira.')
  }
  if (pendente)
    throw new Parada(
      `a avaliação de ${registro.id} não terminou: ${Object.values(avaliacao.avaliadores).find((r) => r.status === 'nao-rodou')?.resumo}`,
    )
}

async function rodarVariante(
  e: Estado,
  caso: Caso,
  variante: Variante,
  conferenciasDoBase: Set<string>,
): Promise<void> {
  const id = `${caso.id}@${variante}`
  conferirPortasLivres(e.suite)
  e.log(`== ${id}`)
  const ws = await criarWorkspace({
    suite: e.suite,
    harnessPatch: e.harnessPatch,
    preparo: lerPatch(caso.pasta, 'preparo.patch'),
    log: e.log,
  })
  // Conferências que valem para o base inteiro (como a regex de narração sem disparo), feitas uma vez por rodada.
  for (const avaliador of AVALIADORES) {
    if (!avaliador.conferirNoBase || conferenciasDoBase.has(avaliador.nome)) continue
    conferenciasDoBase.add(avaliador.nome)
    const r = await avaliador.conferirNoBase(ws)
    e.log(`base: ${avaliador.nome}: ${r.ok ? 'ok' : 'FALHOU'}: ${r.resumo}`)
    e.exp.conferencias_do_base = { ...(e.exp.conferencias_do_base ?? {}), [avaliador.nome]: r }
  }
  const patch = variante === 'nula' ? null : lerPatch(caso.pasta, `${variante}.patch`)
  try {
    if (variante !== 'nula' && !patch) throw new Parada(`${caso.id} não tem ${variante}.patch`)
    aplicarVariante(ws, caso.id, patch)
  } catch (erro) {
    apagarWorkspace(ws)
    throw erro
  }
  const registro: Registro = {
    id,
    caso: caso.id,
    conjunto: caso.conjunto,
    tipo: caso.tipo,
    n: null,
    variante,
    status: 'avaliacao-pendente',
    confere: null,
    avaliadores: {},
    agente: null,
    juiz: { custoUsd: 0, chamadas: 0 },
    marcas: [],
    workspace: ws.pasta,
    inicio: ws.inicio,
    final: '',
    diff: null,
    quando: agora(),
  }
  e.registros = e.registros.filter((r) => r.id !== id)
  e.registros.push(registro)
  await avaliarERegistrar(e, caso, ws, null, registro)
}

function escolherCasos(todos: Caso[], opcoes: Map<string, string | true>, padrao: 'todos' | 'ajuste'): Caso[] {
  const lista = opcoes.get('casos')
  if (typeof lista === 'string') {
    const ids = lista.split(',').map((s) => s.trim())
    const faltam = ids.filter((id) => !todos.some((c) => c.id === id))
    if (faltam.length) throw new Parada(`Casos que não existem: ${faltam.join(', ')}`)
    return todos.filter((c) => ids.includes(c.id))
  }
  const conjunto = String(opcoes.get('conjunto') ?? padrao)
  if (conjunto === 'todos') return todos
  if (conjunto !== 'ajuste' && conjunto !== 'validacao')
    throw new Parada(`--conjunto ${conjunto}: use ajuste, validacao ou todos`)
  return todos.filter((c) => c.conjunto === conjunto)
}

async function principal(): Promise<void> {
  const { opcoes } = lerArgumentos(process.argv.slice(2))
  const suite = lerSuite()
  const todos = lerCasos()
  const retomar = opcoes.get('retomar')
  let exp: Experimento
  const registros: Registro[] = []

  if (typeof retomar === 'string') {
    const { dirExp, dirVal } = pastasDoExperimento(retomar)
    exp = lerJson<Experimento>(path.join(dirExp, 'experimento.json'))
    registros.push(...lerRegistros(dirExp, dirVal))
    exp.fim = null
    exp.parada = null
  } else {
    const modo: Modo = opcoes.has('sem-modelo') ? 'sem-modelo' : opcoes.has('sonda') ? 'sonda' : 'rodada'
    const nome = opcoes.get('nome') ?? (modo === 'rodada' ? undefined : modo)
    if (typeof nome !== 'string' || !/^[a-z0-9-]+$/.test(nome))
      throw new Parada('Dê um --nome em minúsculas e hífens (como linha-de-base).')
    const casos =
      modo === 'sonda'
        ? escolherCasos(todos, new Map([['casos', String(opcoes.get('casos') ?? 'comentarios-03-frase')]]), 'ajuste')
        : escolherCasos(todos, opcoes, 'todos')
    const harnessArquivo = opcoes.get('harness')
    const harnessPatch = typeof harnessArquivo === 'string' ? readFileSync(harnessArquivo, 'utf8') : ''
    const teto = Number(opcoes.get('teto') ?? (modo === 'sonda' ? 1 : suite.teto_tentativa_usd))
    exp = {
      nome,
      data: dataLocal(),
      modo,
      base: suite.base,
      claude_code: suite.claude_code,
      versoes: {},
      agente: {
        ...suite.agente,
        modelo: modo === 'sonda' ? 'claude-haiku-5-5' : String(opcoes.get('modelo') ?? suite.agente.modelo),
        esforco: modo === 'sonda' ? null : String(opcoes.get('esforco') ?? suite.agente.esforco),
      },
      juiz: opcoes.has('sem-juiz') ? null : suite.juiz,
      tentativas: modo === 'rodada' ? Number(opcoes.get('tentativas') ?? suite.tentativas) : 1,
      teto_tentativa_usd: teto,
      orcamento_rodada_usd: Number(opcoes.get('orcamento') ?? suite.orcamento_rodada_usd),
      casos: casos.map((c) => c.id),
      variantes:
        modo === 'sem-modelo'
          ? (String(opcoes.get('variantes') ?? 'referencia,quebrada,nula').split(',') as Variante[])
          : [],
      harness_patch_sha256: sha256(harnessPatch),
      hipotese: String(opcoes.get('hipotese') ?? HIPOTESE_PADRAO[modo]),
      manter: opcoes.has('manter'),
      inicio: agora(),
      fim: null,
      parada: null,
    }
    const dir = path.join(PASTA_EXPERIMENTOS, `${exp.data}-${exp.nome}`)
    if (existsSync(path.join(dir, 'experimento.json'))) {
      throw new Parada(`${path.relative(RAIZ, dir)} já existe. Use --retomar ${path.basename(dir)} ou outro --nome.`)
    }
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'harness.patch'), harnessPatch)
  }

  const { dirExp, dirVal } = pastasDoExperimento(`${exp.data}-${exp.nome}`)
  const log = criarLog(path.join(LOCAL, 'logs', `${exp.data}-${exp.nome}.log`))
  const harnessPatch = readFileSync(path.join(dirExp, 'harness.patch'), 'utf8')
  if (sha256(harnessPatch) !== exp.harness_patch_sha256)
    throw new Parada('O harness.patch do experimento mudou depois que a rodada começou.')

  // Pré-condições: a tag do base, a versão do Claude Code, as portas, o token e a cópia de trabalho do Lucas.
  const tag = gitOk(['rev-parse', `${suite.base.tag}^{commit}`], RAIZ)
  if (tag !== suite.base.commit)
    throw new Parada(
      `${suite.base.tag} aponta para ${tag}; a suíte espera ${suite.base.commit}. Rode git fetch origin --tags.`,
    )
  conferirPortasLivres(suite)
  const comModelo = exp.modo !== 'sem-modelo'
  const token = comModelo || exp.juiz ? lerToken() : null
  if ((comModelo || exp.juiz) && !token) {
    throw new Parada(
      `Falta o token: rode claude setup-token e guarde-o na variável de ambiente do usuário ${VARIAVEL_DO_TOKEN}.`,
    )
  }
  if (comModelo || exp.juiz) {
    const versao = versaoDoClaude()
    if (versao !== suite.claude_code)
      throw new Parada(`Claude Code ${versao} instalado; a suíte espera ${suite.claude_code}.`)
    exp.versoes.claude = `${versao} (${localizarClaude()})`
  }
  exp.versoes.node = process.version
  exp.versoes.git = git(['--version'], RAIZ).saida
  const casos = new Map(todos.map((c) => [c.id, c] as const))
  const estado: Estado = {
    suite,
    exp,
    dirExp,
    dirVal,
    registros,
    casos,
    log,
    juiz: exp.juiz && token ? criarJuiz({ suite, token, log }) : null,
    token,
    harnessPatch,
    cache: new Map(),
    copiaDoLucas: '',
  }
  estado.copiaDoLucas = fotoDaCopia(estado)
  log(
    `${exp.modo} ${exp.data}-${exp.nome}: ${exp.casos.length} caso(s), modelo ${exp.agente.modelo}${exp.juiz ? `, juiz ${exp.juiz.modelo}` : ', sem juiz'}`,
  )

  // Uma tentativa por vez, alternando os casos: a variação do serviço ao longo do dia cai em todos os casos.
  const feitas = (id: string) =>
    estado.registros.some((r) => r.id === id && !['nao-rodou', 'avaliacao-pendente'].includes(r.status))
  try {
    if (exp.modo === 'sem-modelo') {
      const conferencias = new Set<string>()
      for (const id of exp.casos) {
        for (const variante of exp.variantes) {
          if (!feitas(`${id}@${variante}`)) await rodarVariante(estado, casos.get(id)!, variante, conferencias)
        }
      }
    } else {
      for (let n = 1; n <= exp.tentativas; n++) {
        for (const id of exp.casos) {
          const anterior = estado.registros.find((r) => r.id === `${id}#${n}`)
          if (
            anterior?.status === 'avaliacao-pendente' &&
            anterior.workspace &&
            existsSync(anterior.workspace) &&
            anterior.agente
          ) {
            log(`== ${anterior.id}: reavaliação do workspace guardado`)
            const ws = lerJson<Workspace>(path.join(anterior.workspace, 'workspace.json'))
            const eventos = lerEventos(anterior.agente.transcricao)
            const agente: ResultadoDoAgente = { ...anterior.agente, eventos }
            await avaliarERegistrar(estado, casos.get(id)!, ws, agente, anterior)
          } else if (!feitas(`${id}#${n}`)) {
            await rodarTentativa(estado, casos.get(id)!, n)
          }
        }
      }
    }
  } catch (erro) {
    // Um erro inesperado também fica no relatório, e depois sai pelo processo com o rastro.
    exp.parada = erro instanceof Error ? erro.message : String(erro)
    log(`PARADA: ${exp.parada}`)
    if (!(erro instanceof Parada) && !(erro instanceof JuizNaoRodou)) throw erro
  } finally {
    exp.fim = agora()
    await salvar(estado)
    await escreverRelatorios(dirExp, dirVal)
    log(
      `relatório: ${path.relative(RAIZ, path.join(dirExp, 'relatorio.md'))}; gasto: US$ ${custoGasto(estado).toFixed(2)}`,
    )
  }
  if (exp.parada) process.exitCode = 2
}

await principal().catch((erro: unknown) => {
  console.error(erro instanceof Parada ? `Parada: ${erro.message}` : erro)
  process.exitCode = 1
})
