'use client'

import { CONTATO_TEXTO, CONTATO_TITULO, NAV, RODAPE_TOPO } from '@/lib/texto'
import { useAtivo } from './ativo'
import { BotaoWhatsApp } from './BotaoWhatsApp'
import { useRevelar } from './revelar'
import { Robo } from './Robo'

/** "C ON TATO": três pedaços que chegam em tempos diferentes, como o "C ON NECT" do modelo. */
const PEDACOS = [CONTATO_TITULO.slice(0, 1), CONTATO_TITULO.slice(1, 3), CONTATO_TITULO.slice(3)]

function LinkRodape({ href, rotulo }: { href: string; rotulo: string }) {
  const { ativo, props } = useAtivo()
  return (
    <a href={href} className="sinapse-rodape-link" data-efeito="" data-ativo={ativo ? 'true' : 'false'} {...props}>
      <span className="sinapse-nav-pixel" aria-hidden="true" />
      {rotulo}
    </a>
  )
}

/**
 * Fora de `main`. A assinatura, logo abaixo, já leva o nome, então o rodapé traz a navegação do cabeçalho, que abaixo
 * de 768 px só aparece aqui, e a volta ao topo.
 */
export function Rodape() {
  return (
    <footer className="sinapse-rodape">
      <nav className="sinapse-rodape-nav" aria-label="Seções, no rodapé">
        {NAV.map((item) => (
          <LinkRodape key={item.href} {...item} />
        ))}
      </nav>
      <LinkRodape href="#topo" rotulo={RODAPE_TOPO} />
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
