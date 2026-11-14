'use client'

import { useEffect, useRef, useState } from 'react'
import type { Servico } from '@/lib/oferta'
import { EVENTO_LIGAR } from './Rede'
import { Robo } from './Robo'

// O robô operador: caminha pela base do painel até a rede, dá uma batidinha, a rede liga e ele
// volta a caminhar. Repete de tempos em tempos; passar sobre um serviço chama o robô na hora.
// Estados em data-estado: "parado", "andando", "batendo" e "voltando"; a posição vai em --x (0 a 1).

type Estado = 'parado' | 'andando' | 'batendo' | 'voltando'

const ANDAR_MS = 2200
const BATER_MS = 700
const ESPERA_MS = 9000

export function Operador({ ativo, chamado, alvo }: { ativo: boolean; chamado: Servico | null; alvo: React.RefObject<HTMLDivElement | null> }) {
  const [estado, setEstado] = useState<Estado>('parado')
  const temporizador = useRef(0)
  const ocupado = useRef(false)

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    const esperar = (ms: number) => new Promise<void>((r) => (temporizador.current = window.setTimeout(r, ms)))
    const rotina = async () => {
      if (ocupado.current || !vivo) return
      ocupado.current = true
      setEstado('andando')
      await esperar(ANDAR_MS)
      if (!vivo) return
      setEstado('batendo')
      await esperar(BATER_MS * 0.5)
      alvo.current?.querySelector('canvas')?.dispatchEvent(new CustomEvent(EVENTO_LIGAR))
      await esperar(BATER_MS * 0.5)
      if (!vivo) return
      setEstado('voltando')
      await esperar(ANDAR_MS)
      if (!vivo) return
      setEstado('parado')
      ocupado.current = false
    }
    const laco = async () => {
      await esperar(1200)
      while (vivo) {
        if (!document.hidden) await rotina()
        await esperar(ESPERA_MS)
      }
    }
    void laco()
    const aoChamar = () => void rotina()
    const el = alvo.current
    el?.addEventListener('sinapse-chamar', aoChamar)
    return () => {
      vivo = false
      window.clearTimeout(temporizador.current)
      el?.removeEventListener('sinapse-chamar', aoChamar)
    }
  }, [ativo, alvo])

  // Um serviço em destaque chama o robô para bater na rede (a rede lê o destaque na batida).
  useEffect(() => {
    if (!ativo || !chamado) return
    alvo.current?.dispatchEvent(new CustomEvent('sinapse-chamar'))
  }, [ativo, chamado, alvo])

  return (
    <span className="sinapse-operador" data-estado={estado} aria-hidden="true">
      <Robo variante="passeio" className="sinapse-robo-azul" />
      <span className="sinapse-operador-faisca" />
    </span>
  )
}
