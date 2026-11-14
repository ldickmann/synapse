'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * `data-visto`: nasce true (o HTML do servidor mostra tudo). Com movimento, o observador esconde o
 * que ainda está fora da tela e revela uma vez quando entra. Com movimento reduzido fica tudo visível (X4).
 */
export function useRevelar<T extends HTMLElement>(ativo: boolean, margem = '-8% 0px'): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [visto, setVisto] = useState(true)
  const jaVisto = useRef(false)
  useEffect(() => {
    if (!ativo) return
    const el = ref.current
    if (!el) return
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            jaVisto.current = true
            setVisto(true)
            observador.disconnect()
          } else if (!jaVisto.current && entrada.boundingClientRect.top > 0) {
            // Só esconde o que está abaixo da tela; o que já passou fica como está.
            setVisto(false)
          }
        }
      },
      { rootMargin: margem, threshold: 0.12 },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [ativo, margem])
  return [ref, !ativo || visto]
}

/**
 * Progresso 0..1 de um elemento subindo pela tela: 0 quando o topo dele está na base da janela,
 * 1 quando chega a `fim` da altura da janela. Vai para a variável CSS `--p` do próprio elemento.
 */
export function useProgresso<T extends HTMLElement>(ativo: boolean, fim = 0.35): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!ativo) {
      el.style.setProperty('--p', '1')
      return
    }
    let quadro = 0
    const medir = () => {
      quadro = 0
      const r = el.getBoundingClientRect()
      const alvo = window.innerHeight * fim
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight - alvo)))
      el.style.setProperty('--p', p.toFixed(3))
    }
    const aoRolar = () => {
      if (quadro === 0) quadro = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [ativo, fim])
  return ref
}
