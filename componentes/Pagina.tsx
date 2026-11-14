'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { prefereMovimentoReduzido } from '@/lib/capacidades'
import { Cabecalho } from './Cabecalho'
import { Carregamento } from './Carregamento'
import { Contato, Rodape } from './Contato'
import { Fundo } from './Fundo'
import { Hero } from './Hero'
import { Perguntas } from './Perguntas'
import { Servicos } from './Servicos'
import { Sobre } from './Sobre'
import { Trabalhos } from './Trabalhos'

const semAssinatura = () => () => undefined

function assinarMovimento(aoMudar: () => void): () => void {
  const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
  consulta.addEventListener('change', aoMudar)
  return () => consulta.removeEventListener('change', aoMudar)
}

/**
 * Invólucro da página, dono de `data-motion` ("normal" ou "reduzido") e `data-pronto`
 * (true depois da hidratação, quando o canvas das sinapses e os efeitos por JavaScript entram).
 * O HTML do servidor já tem o texto inteiro e o quadriculado em CSS (X3, X4).
 * A `assinatura` chega renderizada de app/page.tsx, de servidor, para não entrar no JS do cliente.
 */
export function Pagina({ assinatura }: { assinatura: ReactNode }) {
  const pronto = useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false,
  )
  const reduzido = useSyncExternalStore(assinarMovimento, prefereMovimentoReduzido, () => false)
  const movimento = pronto && !reduzido

  return (
    <div
      className="sinapse-invol"
      data-motion={reduzido ? 'reduzido' : 'normal'}
      data-pronto={pronto ? 'true' : 'false'}
    >
      <Carregamento />
      <Fundo ativo={movimento} />
      <Cabecalho />
      <main>
        <Hero movimento={movimento} />
        <Servicos movimento={movimento} robos={pronto} />
        <Trabalhos movimento={movimento} />
        <Sobre movimento={movimento} />
        <Perguntas movimento={movimento} />
        <Contato movimento={movimento} />
      </main>
      <Rodape />
      <div className="sinapse-assinatura">{assinatura}</div>
    </div>
  )
}
