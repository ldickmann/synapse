import { MONOGRAMA_PATH, MONOGRAMA_TERMINACAO, MONOGRAMA_TRACO, MONOGRAMA_VIEWBOX } from '@/lib/marca'

export function Monograma() {
  return (
    <svg
      data-monograma="dLK"
      className="sinapse-monograma"
      viewBox={MONOGRAMA_VIEWBOX}
      role="img"
      aria-label="Monograma dLK"
      fill="none"
      stroke="currentColor"
      strokeWidth={MONOGRAMA_TRACO}
      strokeLinecap={MONOGRAMA_TERMINACAO}
      strokeLinejoin={MONOGRAMA_TERMINACAO}
    >
      <path d={MONOGRAMA_PATH} />
    </svg>
  )
}
