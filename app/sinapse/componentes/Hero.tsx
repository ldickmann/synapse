'use client'

import { APOIO, H1, NOME_GIGANTE, PAPEIS } from '../texto'
import { BotaoWhatsApp } from './BotaoWhatsApp'
import { Decodificar } from './Decodificar'
import { Robo } from './Robo'

/** Marquee de papéis: a primeira cópia é lida; as outras são aria-hidden (paridade X3). */
function Marquee() {
  // O "×" entre os papéis vem do CSS (content), para não ser texto só da camada aria-hidden (X3).
  // Os espaços em volta de cada papel separam as palavras no textContent (o flex não os desenha).
  const faixa = PAPEIS.map((papel, i) => (
    <span key={papel} className="sinapse-papel" style={{ '--i': i } as React.CSSProperties}>
      {' '}
      {papel}{' '}
    </span>
  ))
  return (
    <div className="sinapse-marquee">
      <div className="sinapse-marquee-trilho">
        <div className="sinapse-marquee-copia">{faixa}</div>
        <div className="sinapse-marquee-copia" aria-hidden="true">
          {faixa}
        </div>
        <div className="sinapse-marquee-copia" aria-hidden="true">
          {faixa}
        </div>
      </div>
    </div>
  )
}

export function Hero({ movimento }: { movimento: boolean }) {
  return (
    <section className="sinapse-hero" id="topo" aria-labelledby="sinapse-h1">
      <p className="sinapse-nome" aria-label={NOME_GIGANTE.join(' ')}>
        {NOME_GIGANTE.map((palavra, i) => (
          <span key={palavra} className="sinapse-nome-linha" style={{ '--i': i } as React.CSSProperties}>
            <Decodificar texto={palavra} ativo={movimento} atraso={1500 + i * 180} duracao={720} />
            {i === 0 && (
              <span className="sinapse-pouso" aria-hidden="true">
                <Robo variante="pousado" />
                <span className="sinapse-balao" />
              </span>
            )}
          </span>
        ))}
      </p>
      <Marquee />
      <div className="sinapse-hero-texto">
        <h1 id="sinapse-h1">{H1}</h1>
        <p className="sinapse-apoio">{APOIO}</p>
        <BotaoWhatsApp testid="whatsapp-hero" />
      </div>
    </section>
  )
}
