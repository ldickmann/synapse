'use client'

import { PERGUNTAS } from '@/lib/oferta'
import { PERGUNTAS_TITULO } from '../texto'
import { useAtivo } from './ativo'
import { useRevelar } from './revelar'

function Pergunta({ pergunta, resposta, indice }: { pergunta: string; resposta: string; indice: number }) {
  const { ativo, props } = useAtivo()
  return (
    <details className="sinapse-pergunta" style={{ '--i': indice } as React.CSSProperties}>
      <summary data-efeito="" data-ativo={ativo ? 'true' : 'false'} {...props}>
        <span className="sinapse-pergunta-mais" aria-hidden="true" />
        {pergunta}
      </summary>
      <div className="sinapse-pergunta-corpo">
        <p>{resposta}</p>
      </div>
    </details>
  )
}

export function Perguntas({ movimento }: { movimento: boolean }) {
  const [ref, visto] = useRevelar<HTMLElement>(movimento)
  return (
    <section
      ref={ref}
      id="perguntas"
      className="sinapse-secao sinapse-perguntas"
      aria-labelledby="sinapse-perguntas-titulo"
      data-visto={visto ? 'true' : 'false'}
    >
      <div className="sinapse-conteudo sinapse-conteudo-estreito">
        <h2 id="sinapse-perguntas-titulo" className="sinapse-h2">
          {PERGUNTAS_TITULO}
        </h2>
        <div className="sinapse-perguntas-lista">
          {PERGUNTAS.map((p, i) => (
            <Pergunta key={p.pergunta} pergunta={p.pergunta} resposta={p.resposta} indice={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
