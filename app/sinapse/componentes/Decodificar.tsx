'use client'

import { useEffect, useState } from 'react'

// Texto que "decodifica": por alguns instantes cada letra mostra 0 ou 1 e vai assentando da esquerda
// para a direita. O texto real fica sempre no DOM (paridade X3); a camada que cicla é aria-hidden e
// só existe durante a animação. Sem JavaScript ou com movimento reduzido, nada acontece.

type Props = { texto: string; ativo: boolean; atraso?: number; duracao?: number; className?: string }

export function Decodificar({ texto, ativo, atraso = 0, duracao = 700, className = '' }: Props) {
  const [camada, setCamada] = useState<string | null>(null)

  useEffect(() => {
    if (!ativo) return
    let quadro = 0
    const inicio = performance.now() + atraso
    const letras = [...texto]
    const passo = (agora: number) => {
      const p = (agora - inicio) / duracao
      if (p >= 1) {
        setCamada(null)
        return
      }
      if (p >= 0) {
        setCamada(
          letras
            .map((letra, i) => {
              if (letra === ' ') return ' '
              const limiar = (i / letras.length) * 0.8
              return p > limiar + 0.2 ? letra : Math.random() < 0.5 ? '0' : '1'
            })
            .join(''),
        )
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [ativo, atraso, duracao, texto])

  return (
    <span className={`sinapse-decod ${className}`} data-decodificando={camada !== null ? 'true' : 'false'}>
      <span className="sinapse-decod-real">{texto}</span>
      {camada !== null && (
        <span className="sinapse-decod-camada" aria-hidden="true">
          {camada}
        </span>
      )}
    </span>
  )
}
