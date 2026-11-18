'use client'

import { CONTATO_TEXTO, CONTATO_TITULO, RODAPE } from '@/lib/texto'
import { BotaoWhatsApp } from './BotaoWhatsApp'
import { useRevelar } from './revelar'
import { Robo } from './Robo'

/** "C ON TATO": três pedaços que chegam em tempos diferentes, como o "C ON NECT" do modelo. */
const PEDACOS = [CONTATO_TITULO.slice(0, 1), CONTATO_TITULO.slice(1, 3), CONTATO_TITULO.slice(3)]

/** Fora de `main`, para os bits decorativos não entrarem na paridade de texto (X3). */
export function Rodape() {
  return (
    <footer className="sinapse-rodape">
      <span>{RODAPE}</span>
      <span className="sinapse-rodape-bits" aria-hidden="true">
        01000100 01001100 01001011
      </span>
    </footer>
  )
}

export function Contato({ movimento }: { movimento: boolean }) {
  const [ref, visto] = useRevelar<HTMLElement>(movimento)
  return (
    <>
      <section
        ref={ref}
        id="contato"
        className="sinapse-secao sinapse-contato"
        aria-labelledby="sinapse-contato-titulo"
        data-visto={visto ? 'true' : 'false'}
      >
        <div className="sinapse-conteudo">
          <h2 id="sinapse-contato-titulo" className="sinapse-titulo-gigante sinapse-contato-titulo">
            {PEDACOS.map((pedaco, i) => (
              <span key={pedaco} className="sinapse-pedaco" style={{ '--i': i } as React.CSSProperties}>
                {pedaco}
              </span>
            ))}
            <span className="sinapse-aceno" aria-hidden="true">
              <Robo variante="acenando" />
            </span>
          </h2>
          <p className="sinapse-contato-texto">{CONTATO_TEXTO}</p>
          <BotaoWhatsApp testid="whatsapp-final" className="sinapse-botao-grande" />
        </div>
      </section>
    </>
  )
}
