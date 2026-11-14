'use client'

import { TRABALHOS_REAIS } from '@/lib/trabalhos'
import { TRABALHOS_APOIO, TRABALHOS_LINK, TRABALHOS_TITULO } from '../texto'
import { useAtivo } from './ativo'
import { useRevelar } from './revelar'
import { Robo } from './Robo'

/** "T RA BA LHOS" como o "W O RK" do modelo: pedaços com respiro, o robô dourado em cima do último. */
const PEDACOS = [TRABALHOS_TITULO.slice(0, 1), TRABALHOS_TITULO.slice(1, 3), TRABALHOS_TITULO.slice(3, 5), TRABALHOS_TITULO.slice(5)]

function Cartao({ nome, tipo, imagem, link }: { nome: string; tipo: string; imagem: string | null; link: string }) {
  const { ativo, props } = useAtivo()
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="sinapse-trabalho"
      data-efeito=""
      data-ativo={ativo ? 'true' : 'false'}
      {...props}
    >
      <span className="sinapse-trabalho-imagem">
        {imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt="" width={1200} height={900} loading="lazy" />
        )}
        <span className="sinapse-trabalho-varredura" aria-hidden="true" />
      </span>
      <span className="sinapse-trabalho-texto">
        <span className="sinapse-trabalho-nome">{nome}</span>
        <span className="sinapse-trabalho-tipo">{tipo}</span>
        <span className="sinapse-trabalho-link">{TRABALHOS_LINK}</span>
      </span>
    </a>
  )
}

export function Trabalhos({ movimento }: { movimento: boolean }) {
  const [ref, visto] = useRevelar<HTMLElement>(movimento)
  if (TRABALHOS_REAIS.length === 0) return null
  return (
    <section
      ref={ref}
      id="trabalhos"
      className="sinapse-secao sinapse-trabalhos"
      aria-labelledby="sinapse-trabalhos-titulo"
      data-visto={visto ? 'true' : 'false'}
    >
      <div className="sinapse-conteudo">
        <h2 id="sinapse-trabalhos-titulo" className="sinapse-titulo-gigante sinapse-trabalhos-titulo">
          {PEDACOS.map((pedaco, i) => (
            <span key={pedaco} className="sinapse-pedaco" style={{ '--i': i } as React.CSSProperties}>
              {pedaco}
            </span>
          ))}
          <span className="sinapse-trabalhos-robo" aria-hidden="true">
            <Robo variante="pousado" className="sinapse-robo-dourado" />
          </span>
        </h2>
        <p className="sinapse-servicos-apoio">{TRABALHOS_APOIO}</p>
        <div className="sinapse-trabalhos-lista">
          {TRABALHOS_REAIS.map((t) => (
            <Cartao key={t.id} nome={t.nome} tipo={t.tipo} imagem={t.imagem} link={t.link ?? '#'} />
          ))}
        </div>
      </div>
    </section>
  )
}
