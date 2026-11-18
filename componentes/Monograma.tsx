import { MONOGRAMA_PECAS, MONOGRAMA_VIEWBOX } from '@/lib/marca'

export function Monograma() {
  return (
    <svg
      data-monograma="DLK"
      className="sinapse-monograma"
      viewBox={MONOGRAMA_VIEWBOX}
      role="img"
      aria-label="Logo DLK"
    >
      <path className="sinapse-monograma-l" d={MONOGRAMA_PECAS.l} />
      <path className="sinapse-monograma-letra" d={MONOGRAMA_PECAS.d} />
      <path className="sinapse-monograma-letra" d={MONOGRAMA_PECAS.k} />
    </svg>
  )
}
