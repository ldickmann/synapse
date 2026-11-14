'use client'

import { linkWhatsApp } from '@/lib/contato'
import { COORDENADAS, SOBRE_PARAGRAFOS, SOBRE_TITULO, TRECHOS, numeroFormatado } from '../texto'
import { useAtivo } from './ativo'
import { Memoria } from './Memoria'
import { Monograma } from './Monograma'
import { useRevelar } from './revelar'


/** Os trechos e a faixa de bits são desenhados por `content: attr(...)`: decoração que não vira texto (X3). */
function Trechos() {
  return (
    <div className="sinapse-trechos" aria-hidden="true">
      {TRECHOS.map((linhas, i) => (
        <span key={i} className="sinapse-trecho" data-texto={linhas.join('\n')} style={{ '--i': i } as React.CSSProperties} />
      ))}
    </div>
  )
}

export function Sobre({ movimento }: { movimento: boolean }) {
  const [ref, visto] = useRevelar<HTMLElement>(movimento)
  const numero = useAtivo()
  return (
    <section
      ref={ref}
      id="quem"
      className="sinapse-secao sinapse-sobre"
      aria-labelledby="sinapse-sobre-titulo"
      data-visto={visto ? 'true' : 'false'}
    >
      <Trechos />
      <div className="sinapse-conteudo sinapse-sobre-grade">
        <div className="sinapse-sobre-marca" aria-hidden="true">
          <Monograma />
          <span className="sinapse-sobre-barra" />
        </div>
        <div className="sinapse-sobre-texto">
          <h2 id="sinapse-sobre-titulo" className="sinapse-h2">
            {SOBRE_TITULO}
          </h2>
          {SOBRE_PARAGRAFOS.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="sinapse-sobre-dados">
          <p className="sinapse-coordenadas">
            <span className="sinapse-coordenada">{`/ ${COORDENADAS.lat}`}</span>
            <span className="sinapse-coordenada">{`// ${COORDENADAS.lon}`}</span>
          </p>
          <Memoria ativo={movimento} />
          <a
            href={linkWhatsApp()}
            className="sinapse-numero"
            data-efeito=""
            data-ativo={numero.ativo ? 'true' : 'false'}
            {...numero.props}
          >
            {numeroFormatado()}
          </a>
        </div>
      </div>
    </section>
  )
}
