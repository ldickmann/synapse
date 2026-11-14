'use client'

import { linkWhatsApp } from '@/lib/contato'
import { BOTAO_WHATSAPP } from '../texto'
import { useAtivo } from './ativo'

/** Botão de contato: ao passar, os pixels da borda "disparam" e um robô espia pelo canto. */
export function BotaoWhatsApp({ testid, className = '' }: { testid: string; className?: string }) {
  const { ativo, props } = useAtivo()
  return (
    <a
      href={linkWhatsApp()}
      className={`sinapse-botao ${className}`}
      data-testid={testid}
      data-efeito=""
      data-ativo={ativo ? 'true' : 'false'}
      {...props}
    >
      <span className="sinapse-botao-texto">{BOTAO_WHATSAPP}</span>
      <span className="sinapse-botao-bits" aria-hidden="true" />
    </a>
  )
}
