'use client'

import { useEffect, useRef } from 'react'

// Fundo: a nebulosa em pixels. Céu marinho em cima com estrelas (algumas com picos), azul aberto no
// meio e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
// blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
// segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).

const CELULA = 20
const VIDA_MS = 900
const INTERVALO_MS = 380

type Faisca = { c: number; l: number; vida: number; cor: string }

/** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
function ruido(c: number, l: number, semente = 0): number {
  let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
function suave(c: number, l: number, escala: number, semente: number): number {
  const x = c / escala
  const y = l / escala
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = ruido(x0, y0, semente)
  const b = ruido(x0 + 1, y0, semente)
  const cc = ruido(x0, y0 + 1, semente)
  const d = ruido(x0 + 1, y0 + 1, semente)
  return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
}

const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
/** Mistura dois tokens em hex numa fração t e devolve hex. */
function misturar(a: string, b: string, t: number): string {
  return `#${[0, 1, 2]
    .map((i) => Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t).toString(16).padStart(2, '0'))
    .join('')}`
}

export function Fundo({ ativo }: { ativo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!ativo || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const raiz = canvas.closest('[data-estilo="sinapse"]') ?? document.documentElement
    const estilo = getComputedStyle(raiz)
    const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
    const cores = {
      baixo: cor('fundo-baixo'),
      fundo: cor('fundo'),
      alto: cor('fundo-alto'),
      ceu: cor('ceu'),
      azul: cor('azul'),
      acento: cor('acento'),
      brasa: cor('brasa'),
      pessego: cor('pessego'),
      dourado: cor('dourado'),
      rosa: cor('rosa'),
      estrela: cor('estrela'),
      ferrugem: cor('ferrugem'),
      marrom: cor('marrom'),
    }

    let dpr = 1
    let colunas = 0
    let linhas = 0
    let base: HTMLCanvasElement | null = null
    let faiscas: Faisca[] = []
    let quadro = 0
    let ultimo = 0

    function desenharBase() {
      if (!base) return
      const b = base.getContext('2d')
      if (!b) return
      const t = CELULA * dpr
      for (let l = 0; l < linhas; l++) {
        const y = l / Math.max(1, linhas - 1)
        // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
        const ceu = y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
        b.fillStyle = ceu
        b.fillRect(0, l * t, base!.width, t)
        for (let c = 0; c < colunas; c++) {
          // Textura do céu: blocos um tom mais claros, irregulares.
          if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
            b.fillStyle = misturar(ceu, cores.alto, 0.5)
            b.fillRect(c * t, l * t, t, t)
          }
          // Estrelas: raras, mais no alto; as grandes ganham quatro picos.
          const r = ruido(c, l, 3)
          if (r > 0.991 - (1 - y) * 0.006) {
            const grande = r > 0.9985
            b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
            b.fillRect(c * t, l * t, t, t)
            if (grande) {
              b.globalAlpha = 0.3
              b.fillRect((c - 1) * t, l * t, t * 3, t)
              b.fillRect(c * t, (l - 1) * t, t, t * 3)
              b.globalAlpha = 1
            }
          }
          // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
          const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
          if (y > borda) {
            const prof = (y - borda) / Math.max(0.05, 1 - borda)
            const n = suave(c, l, 5, 7)
            let tom: string
            if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
            else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
            else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
            else tom = n > 0.7 ? cores.ferrugem : cores.marrom
            // Buracos de gás ionizado em rosa, raros.
            if (ruido(c, l, 8) > 0.993) tom = cores.rosa
            b.fillStyle = tom
            b.fillRect(c * t, l * t, t, t)
          }
        }
      }
    }

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.ceil(window.innerWidth * dpr)
      canvas!.height = Math.ceil(window.innerHeight * dpr)
      canvas!.style.width = `${window.innerWidth}px`
      canvas!.style.height = `${window.innerHeight}px`
      colunas = Math.ceil(window.innerWidth / CELULA)
      linhas = Math.ceil(window.innerHeight / CELULA)
      base = document.createElement('canvas')
      base.width = canvas!.width
      base.height = canvas!.height
      desenharBase()
      desenhar()
    }

    function desenhar() {
      if (!base) return
      ctx!.drawImage(base, 0, 0)
      const t = CELULA * dpr
      for (const f of faiscas) {
        ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
        ctx!.fillStyle = f.cor
        ctx!.fillRect(f.c * t, f.l * t, t, t)
      }
      ctx!.globalAlpha = 1
    }

    function tique(agora: number) {
      const dt = Math.min(64, agora - ultimo)
      ultimo = agora
      for (const f of faiscas) f.vida -= dt / VIDA_MS
      faiscas = faiscas.filter((f) => f.vida > 0)
      desenhar()
      quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
    }

    function acordar() {
      if (quadro === 0 && !document.hidden) {
        ultimo = performance.now()
        quadro = requestAnimationFrame(tique)
      }
    }

    function acender(c: number, l: number, cor: string) {
      if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
      const existente = faiscas.find((f) => f.c === c && f.l === l)
      if (existente) existente.vida = 1
      else faiscas.push({ c, l, vida: 1, cor })
      acordar()
    }

    // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
    const intervalo = window.setInterval(() => {
      if (document.hidden) return
      const c = Math.floor(Math.random() * colunas)
      const l = Math.floor(Math.random() * linhas)
      const sorteio = Math.random()
      acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
      if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
    }, INTERVALO_MS)

    let ultimaCelula = ''
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const c = Math.floor(e.clientX / CELULA)
      const l = Math.floor(e.clientY / CELULA)
      const chave = `${c}:${l}`
      if (chave === ultimaCelula) return
      ultimaCelula = chave
      acender(c, l, cores.acento)
    }
    const aoVisibilidade = () => {
      if (document.hidden && quadro) {
        cancelAnimationFrame(quadro)
        quadro = 0
      } else acordar()
    }

    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('pointermove', aoMover, { passive: true })
    document.addEventListener('visibilitychange', aoVisibilidade)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener('resize', medir)
      window.removeEventListener('pointermove', aoMover)
      document.removeEventListener('visibilitychange', aoVisibilidade)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [ativo])

  if (!ativo) return null
  return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
}
