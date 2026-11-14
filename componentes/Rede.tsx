'use client'

import { useEffect, useRef } from 'react'
import { SERVICOS, type Servico } from '@/lib/oferta'

// Rede neural densa em canvas, como nas simulações de redes dentro de um modelo de linguagem:
// uma grade de entrada em pixels (o glifo que a rede está "lendo"), 16 entradas, duas camadas
// ocultas de 28 neurônios, três saídas (os serviços), 1 316 ligações. A cada 2,6 s uma onda de
// ativação atravessa a rede da esquerda para a direita: as ligações no caminho acendem em laranja
// e dourado, os neurônios brilham, os valores das saídas se mexem e a vencedora ganha a caixa.
// Passar sobre um serviço força a saída dele a vencer. As cores vêm dos tokens (G26).

/** Evento que o robô operador dispara no canvas ao bater na rede. */
export const EVENTO_LIGAR = 'sinapse-ligar'

const ENTRADAS = 16
const OCULTOS = 28
const PERIODO_MS = 2600
const DURACAO_ONDA_MS = 1500
/** Depois da batida do robô a rede trabalha por este tempo e depois para no último estado. */
const LIGADA_MS = 9000
const GRADE = 12

type Camada = { x: number; n: number }

/** Glifos de 12×12 que a entrada "lê": d, L, K e o robô. */
const GLIFOS: readonly string[][] = [
  [
    '........####',
    '........####',
    '........####',
    '...#########',
    '..####..####',
    '.####...####',
    '.###....####',
    '.###....####',
    '.####...####',
    '..####..####',
    '...#########',
    '............',
  ],
  [
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###........',
    '.###########',
    '.###########',
    '............',
  ],
  [
    '.###.....###',
    '.###....###.',
    '.###...###..',
    '.###..###...',
    '.###.###....',
    '.#######....',
    '.###.###....',
    '.###..###...',
    '.###...###..',
    '.###....###.',
    '.###.....###',
    '............',
  ],
  [
    '.....##.....',
    '.....#......',
    '..########..',
    '..########..',
    '..#.####.#..',
    '..########..',
    '..#....#.#..',
    '..########..',
    '.....##.....',
    '...######...',
    '.#.######.#.',
    '...##..##...',
  ],
]

function hash(i: number, j: number, s = 0): number {
  let h = (i * 73856093) ^ (j * 19349663) ^ (s * 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Token em hex com alfa (hex de 8 dígitos). */
const comAlfa = (hex: string, a: number) =>
  `${hex}${Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, '0')}`

export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const destaqueRef = useRef<Servico | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const estilo = getComputedStyle(document.documentElement)
    const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
    const cores = {
      baixo: cor('fundo-baixo'),
      linha: cor('linha'),
      ceu: cor('ceu'),
      azul: cor('azul'),
      poeira: cor('poeira'),
      acento: cor('acento'),
      dourado: cor('dourado'),
      pessego: cor('pessego'),
      rosa: cor('rosa'),
      texto: cor('texto'),
      suave: cor('texto-suave'),
      estrela: cor('estrela'),
    }
    const fonte = getComputedStyle(canvas).fontFamily
    const SAIDAS = SERVICOS.length
    const CAMADAS: Camada[] = [
      { x: 0.26, n: ENTRADAS },
      { x: 0.47, n: OCULTOS },
      { x: 0.66, n: OCULTOS },
      { x: 0.84, n: SAIDAS },
    ]
    const coresSaida = [cores.azul, cores.dourado, cores.pessego]

    let largura = 0
    let altura = 0
    let dpr = 1
    let base: HTMLCanvasElement | null = null
    let quadro = 0
    let visivel = true
    let inicioOnda = performance.now()
    let ligadaAte = 0
    let glifo = 0
    let vencedora = 0
    let valores = [0.2, 0.2, 0.2]
    let alvos = [0.9, 0.2, 0.3]

    const posicoes = (): { x: number; y: number }[][] =>
      CAMADAS.map((cam) =>
        Array.from({ length: cam.n }, (_, i) => ({
          x: cam.x * largura,
          y: cam.n === SAIDAS ? altura * (0.28 + (i / (SAIDAS - 1)) * 0.44) : altura * (0.08 + ((i + 0.5) / cam.n) * 0.84),
        })),
      )

    function sortearAlvos() {
      const forcada = destaqueRef.current
      vencedora = forcada ? SERVICOS.findIndex((s) => s.id === forcada) : Math.floor(Math.random() * SAIDAS)
      alvos = alvos.map((_, i) => (i === vencedora ? 0.86 + Math.random() * 0.13 : 0.04 + Math.random() * 0.4))
      glifo = (glifo + 1) % GLIFOS.length
    }

    function medir() {
      const caixa = canvas!.getBoundingClientRect()
      largura = Math.max(1, Math.round(caixa.width))
      altura = Math.max(1, Math.round(caixa.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(largura * dpr)
      canvas!.height = Math.round(altura * dpr)
      base = document.createElement('canvas')
      base.width = canvas!.width
      base.height = canvas!.height
      const b = base.getContext('2d')
      if (!b) return
      b.scale(dpr, dpr)
      const p = posicoes()
      // Todas as ligações, finas, com o peso decidindo a opacidade.
      b.lineWidth = 0.6
      for (let k = 0; k < CAMADAS.length - 1; k++) {
        for (let i = 0; i < p[k].length; i++) {
          for (let j = 0; j < p[k + 1].length; j++) {
            const peso = hash(i, j, k)
            b.strokeStyle = comAlfa(peso > 0.5 ? cores.ceu : cores.linha, 0.1 + peso * 0.3)
            b.beginPath()
            b.moveTo(p[k][i].x, p[k][i].y)
            b.lineTo(p[k + 1][j].x, p[k + 1][j].y)
            b.stroke()
          }
        }
      }
      desenhar(performance.now())
    }

    function desenhar(agora: number) {
      if (!base) return
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.drawImage(base, 0, 0)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const p = posicoes()
      const fase = Math.min(1, (agora - inicioOnda) / DURACAO_ONDA_MS)
      // A frente da onda em x, da primeira camada até depois da última.
      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
      const nomeFonte = `${fonte}`

      // Grade de entrada: o glifo lido, em pixels; os pixels acesos piscam quando a onda começa.
      const g = GLIFOS[glifo]
      const lado = Math.min(largura * 0.14, altura * 0.6) / GRADE
      const gx = largura * 0.05
      const gy = altura / 2 - (lado * GRADE) / 2
      for (let l = 0; l < GRADE; l++) {
        for (let c = 0; c < GRADE; c++) {
          const aceso = g[l][c] === '#'
          ctx!.fillStyle = aceso ? (fase < 0.2 ? cores.dourado : cores.azul) : comAlfa(cores.linha, 0.35)
          ctx!.fillRect(gx + c * lado, gy + l * lado, lado - 1, lado - 1)
        }
      }
      // Da grade para as entradas: as linhas dos pixels acesos.
      ctx!.lineWidth = 0.6
      ctx!.strokeStyle = comAlfa(cores.azul, 0.25)
      for (let l = 0; l < GRADE; l++) {
        const contagem = g[l].split('#').length - 1
        if (contagem === 0) continue
        const alvo = p[0][Math.floor((l / GRADE) * ENTRADAS)]
        ctx!.beginPath()
        ctx!.moveTo(gx + lado * GRADE, gy + l * lado + lado / 2)
        ctx!.lineTo(alvo.x, alvo.y)
        ctx!.stroke()
      }

      // Ligações no caminho da onda: acendem onde a frente passa, laranja virando dourado.
      ctx!.lineWidth = 1.1
      for (let k = 0; k < CAMADAS.length - 1; k++) {
        const x0 = CAMADAS[k].x
        const x1 = CAMADAS[k + 1].x
        if (frente < x0) continue
        const parcial = Math.min(1, (frente - x0) / (x1 - x0))
        const esfriando = Math.max(0, 1 - (frente - x1) / 0.25)
        if (esfriando <= 0) continue
        for (let i = 0; i < p[k].length; i++) {
          for (let j = 0; j < p[k + 1].length; j++) {
            const peso = hash(i, j, k)
            if (peso < 0.72) continue
            const paraVencedora = k === CAMADAS.length - 2 ? j === vencedora : true
            if (!paraVencedora && peso < 0.9) continue
            const a = (peso - 0.72) * 2.2 * esfriando
            ctx!.strokeStyle = comAlfa(paraVencedora && k === CAMADAS.length - 2 ? cores.dourado : cores.acento, Math.min(0.9, a))
            const xi = p[k][i].x
            const yi = p[k][i].y
            const xj = xi + (p[k + 1][j].x - xi) * parcial
            const yj = yi + (p[k + 1][j].y - yi) * parcial
            ctx!.beginPath()
            ctx!.moveTo(xi, yi)
            ctx!.lineTo(xj, yj)
            ctx!.stroke()
          }
        }
      }

      // Neurônios: quadrados; acesos quando a onda passa por eles.
      for (let k = 0; k < CAMADAS.length; k++) {
        const ehSaida = k === CAMADAS.length - 1
        const tamanho = ehSaida ? 14 : k === 0 ? 7 : 6
        const passou = frente >= CAMADAS[k].x
        const brilho = passou ? Math.max(0, 1 - (frente - CAMADAS[k].x) / 0.3) : 0
        for (let i = 0; i < p[k].length; i++) {
          const ativoNo = hash(i, glifo, 40 + k) > 0.35
          let tom = cores.poeira
          if (ehSaida) tom = coresSaida[i]
          else if (brilho > 0 && ativoNo) tom = cores.acento
          ctx!.fillStyle = tom
          if (brilho > 0 && (ativoNo || ehSaida)) {
            ctx!.shadowColor = ehSaida ? coresSaida[i] : cores.acento
            ctx!.shadowBlur = 14 * brilho
          }
          ctx!.fillRect(p[k][i].x - tamanho / 2, p[k][i].y - tamanho / 2, tamanho, tamanho)
          ctx!.shadowBlur = 0
        }
      }

      // Valores das saídas: aproximam-se do alvo quando a onda chega; a vencedora ganha a caixa.
      const chegou = frente >= CAMADAS[CAMADAS.length - 1].x
      valores = valores.map((v, i) => {
        const alvo = chegou ? alvos[i] : v + (Math.random() - 0.5) * 0.08
        return v + (Math.min(1, Math.max(0, alvo)) - v) * (chegou ? 0.12 : 0.3)
      })
      ctx!.textBaseline = 'middle'
      for (let i = 0; i < SAIDAS; i++) {
        const { x, y } = p[CAMADAS.length - 1][i]
        const nome = SERVICOS[i].nome.split(' ')[0]
        const valor = valores[i].toFixed(3)
        const ganhou = chegou && i === vencedora
        ctx!.font = `700 ${Math.max(11, largura * 0.011)}px ${nomeFonte}`
        const lw = ctx!.measureText(nome).width
        if (ganhou) {
          ctx!.fillStyle = cores.dourado
          ctx!.fillRect(x + 16, y - 12, lw + 16, 24)
          ctx!.fillStyle = cores.baixo
        } else ctx!.fillStyle = cores.texto
        ctx!.fillText(nome, x + 24, y)
        ctx!.font = `500 ${Math.max(10, largura * 0.0095)}px ${nomeFonte}`
        ctx!.fillStyle = ganhou ? cores.dourado : cores.suave
        ctx!.fillText(valor, x + 24 + lw + 26, y)
      }

      // Rótulos das camadas.
      ctx!.font = `500 ${Math.max(9, largura * 0.008)}px ${nomeFonte}`
      ctx!.fillStyle = comAlfa(cores.azul, 0.8)
      ctx!.textBaseline = 'top'
      const rotulos = ['entrada 16', 'oculta 28', 'oculta 28', 'saída 3']
      CAMADAS.forEach((cam, k) => ctx!.fillText(rotulos[k], cam.x * largura - 18, 6))
      ctx!.fillText('leitura', gx, gy - 14)
    }

    function tique(agora: number) {
      if (agora - inicioOnda > PERIODO_MS) {
        inicioOnda = agora
        sortearAlvos()
      }
      desenhar(agora)
      // Trabalha enquanto estiver ligada e na tela; depois para no último estado.
      quadro = visivel && ativo && agora < ligadaAte ? requestAnimationFrame(tique) : 0
    }

    // A batida do robô: a rede liga, com uma onda nova na hora (a saída em destaque vence).
    const ligar = () => {
      const agora = performance.now()
      inicioOnda = agora
      ligadaAte = agora + LIGADA_MS
      sortearAlvos()
      if (!ativo) {
        // Movimento reduzido: um único quadro com a onda já no fim e os valores assentados.
        inicioOnda -= DURACAO_ONDA_MS
        valores = [...alvos]
        desenhar(agora)
        return
      }
      if (visivel && quadro === 0) quadro = requestAnimationFrame(tique)
    }
    canvas.addEventListener(EVENTO_LIGAR, ligar)
    const observador = new IntersectionObserver((entradas) => {
      visivel = entradas.some((e) => e.isIntersecting)
      if (visivel && quadro === 0 && ativo && performance.now() < ligadaAte) quadro = requestAnimationFrame(tique)
    })
    observador.observe(canvas)
    const aoRedimensionar = () => medir()
    window.addEventListener('resize', aoRedimensionar)
    sortearAlvos()
    // Antes da primeira batida: um quadro parado, com a onda assentada.
    inicioOnda = performance.now() - DURACAO_ONDA_MS
    valores = [...alvos]
    medir()
    return () => {
      observador.disconnect()
      canvas.removeEventListener(EVENTO_LIGAR, ligar)
      window.removeEventListener('resize', aoRedimensionar)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [ativo])

  useEffect(() => {
    destaqueRef.current = destaque
  }, [destaque])

  return <canvas ref={ref} className="sinapse-rede" aria-hidden="true" />
}
