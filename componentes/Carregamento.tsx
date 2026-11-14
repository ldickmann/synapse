import { BOOT_TEXTO } from '@/lib/texto'
import { Robo } from './Robo'

// Sequência de carregamento só em CSS: vem no HTML do servidor, roda uma vez e some sozinha
// (animação com fill forwards), sem depender de JavaScript. Com movimento reduzido o reset global
// zera as durações e ela nem aparece. aria-hidden: não entra na paridade de texto (X3).
const BITS = ['0110', '1001', '0011', '1100', '0101', '1010', '1111', '0001']

export function Carregamento() {
  return (
    <div className="sinapse-boot" aria-hidden="true">
      <div className="sinapse-boot-centro">
        <Robo variante="boot" />
        <div className="sinapse-boot-barra">
          {BITS.map((grupo, i) => (
            <span key={i} className="sinapse-boot-bit" style={{ '--i': i } as React.CSSProperties}>
              {grupo}
            </span>
          ))}
        </div>
        <span className="sinapse-boot-texto">{BOOT_TEXTO}</span>
      </div>
      <div className="sinapse-boot-cortina" />
    </div>
  )
}
