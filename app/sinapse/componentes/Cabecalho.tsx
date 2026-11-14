'use client'

import { NOME_COMPLETO } from '@/lib/marca'
import { NAV } from '../texto'
import { useAtivo } from './ativo'
import { Monograma } from './Monograma'
import { Robo } from './Robo'

function LinkNav({ href, rotulo }: { href: string; rotulo: string }) {
  const { ativo, props } = useAtivo()
  return (
    <a href={href} className="sinapse-nav-link" data-efeito="" data-ativo={ativo ? 'true' : 'false'} {...props}>
      <span className="sinapse-nav-pixel" aria-hidden="true" />
      {rotulo}
    </a>
  )
}

/** Cabeçalho fixo: monograma, nome, navegação e a mini IA que passeia pela barra como o pássaro do modelo. */
export function Cabecalho() {
  return (
    <header className="sinapse-cabecalho">
      <a href="#topo" className="sinapse-marca" aria-label={`${NOME_COMPLETO}, início da página`}>
        <Monograma />
        <span className="sinapse-marca-nome">{NOME_COMPLETO}</span>
      </a>
      <nav className="sinapse-nav" aria-label="Seções">
        {NAV.map((item) => (
          <LinkNav key={item.href} {...item} />
        ))}
      </nav>
      <div className="sinapse-passeio" aria-hidden="true">
        <Robo variante="passeio" />
      </div>
    </header>
  )
}
