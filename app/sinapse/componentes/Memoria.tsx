'use client'

import { useEffect, useRef } from 'react'
import { Robo } from './Robo'

// Memória RAM: um pente com oito chips de 16 células. As células acendem em leitura (ciano) e
// escrita (rosa) em tempos diferentes, só em CSS; o endereço em hexadecimal muda por JavaScript
// num atributo lido por `content: attr()` (X3). Um robô rosa cuida do pente.

const CHIPS = 8
const CELULAS = 16

export function Memoria({ ativo }: { ativo: boolean }) {
  const endereco = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = endereco.current
    if (!el || !ativo) return
    const intervalo = window.setInterval(() => {
      const valor = Math.floor(Math.random() * 0xffff)
      el.setAttribute('data-endereco', `0x${valor.toString(16).toUpperCase().padStart(4, '0')}`)
      el.setAttribute('data-modo', Math.random() < 0.7 ? 'leitura' : 'escrita')
    }, 220)
    return () => window.clearInterval(intervalo)
  }, [ativo])

  return (
    <div className="sinapse-ram" aria-hidden="true">
      <div className="sinapse-ram-pente">
        {Array.from({ length: CHIPS }, (_, chip) => (
          <div key={chip} className="sinapse-ram-chip" style={{ '--chip': chip } as React.CSSProperties}>
            {Array.from({ length: CELULAS }, (_, celula) => (
              <i key={celula} style={{ '--c': (celula * 7 + chip * 3) % 16 } as React.CSSProperties} />
            ))}
          </div>
        ))}
        <span className="sinapse-ram-contatos" />
      </div>
      <span ref={endereco} className="sinapse-ram-endereco" data-endereco="0x0000" data-modo="leitura" />
      <span className="sinapse-ram-robo">
        <Robo variante="acenando" className="sinapse-robo-rosa" />
      </span>
    </div>
  )
}
