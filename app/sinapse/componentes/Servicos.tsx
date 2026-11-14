'use client'

import { useRef, useState } from 'react'
import { SERVICOS, type Servico } from '@/lib/oferta'
import { FRASE_GIGANTE, SERVICOS_APOIO, SERVICOS_LINHAS, SERVICOS_TITULO } from '../texto'
import { useAtivo } from './ativo'
import { Operador } from './Operador'
import { Rede } from './Rede'
import { useProgresso, useRevelar } from './revelar'


function Servico({
  id,
  nome,
  indice,
  aoDestacar,
}: {
  id: Servico
  nome: string
  indice: number
  aoDestacar: (s: Servico | null) => void
}) {
  const { ativo, props } = useAtivo()
  return (
    <a
      href="#contato"
      className="sinapse-servico"
      data-servico={id}
      data-efeito=""
      data-ativo={ativo ? 'true' : 'false'}
      style={{ '--i': indice } as React.CSSProperties}
      {...props}
      onPointerEnter={(e) => {
        props.onPointerEnter(e)
        aoDestacar(id)
      }}
      onPointerLeave={() => {
        props.onPointerLeave()
        aoDestacar(null)
      }}
      onFocus={(e) => {
        props.onFocus(e)
        aoDestacar(id)
      }}
      onBlur={() => {
        props.onBlur()
        aoDestacar(null)
      }}
    >
      <span className="sinapse-servico-no" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sinapse-servico-nome">{nome}</span>
      <span className="sinapse-servico-linha">{SERVICOS_LINHAS[id]}</span>
    </a>
  )
}

// `robos`: os robôs ignoram a preferência de movimento reduzido; só dependem da hidratação.
export function Servicos({ movimento, robos }: { movimento: boolean; robos: boolean }) {
  const [destaque, setDestaque] = useState<Servico | null>(null)
  const moldura = useRef<HTMLDivElement>(null)
  const titulo = useProgresso<HTMLHeadingElement>(movimento, 0.4)
  const [ref, visto] = useRevelar<HTMLElement>(movimento)
  const frase = useProgresso<HTMLParagraphElement>(movimento, 0.3)
  const palavras = FRASE_GIGANTE.split(' ')
  return (
    <section
      ref={ref}
      id="servicos"
      className="sinapse-secao sinapse-servicos"
      aria-labelledby="sinapse-servicos-titulo"
      data-visto={visto ? 'true' : 'false'}
      data-destaque={destaque ?? 'nenhum'}
    >
      <div className="sinapse-conteudo">
        <h2 id="sinapse-servicos-titulo" ref={titulo} className="sinapse-titulo-gigante">
          {[...SERVICOS_TITULO].map((letra, i) => (
            <span key={i} className="sinapse-letra" style={{ '--i': i } as React.CSSProperties}>
              {letra}
            </span>
          ))}
        </h2>
        <p className="sinapse-servicos-apoio">{SERVICOS_APOIO}</p>
        <div className="sinapse-servicos-grade">
          <div ref={moldura} className="sinapse-rede-moldura">
            <Rede destaque={destaque} ativo={movimento} />
            <Operador ativo={robos} chamado={destaque} alvo={moldura} />
          </div>
          <div className="sinapse-servicos-lista">
            {SERVICOS.map((s, i) => (
              <Servico key={s.id} id={s.id} nome={s.nome} indice={i} aoDestacar={setDestaque} />
            ))}
          </div>
        </div>
        <p ref={frase} className="sinapse-frase">
          {palavras.map((palavra, i) => (
            <span key={i} className="sinapse-frase-palavra" style={{ '--i': i, '--n': palavras.length } as React.CSSProperties}>
              {palavra}
              {i < palavras.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
