// Mini IA em pixel art: 12 por 14 células, só retângulos, cor por currentColor (G26).
// Os olhos e a boca "furam" o corpo com a cor do fundo; o peito leva a luz dourada.
// As partes ficam em grupos (cabeça, tronco, braço direito, pernas) para o ciclo de poses em CSS:
// como o pássaro do modelo, o robô troca de pose em quadros segurados por tempos desiguais
// (parado, agachado, pulinho, olhando para o lado), sem interpolação.
type Celula = readonly [x: number, y: number, w: number, h: number]

const CABECA: readonly Celula[] = [
  [5, 0, 2, 1], // antena, ponta
  [5, 1, 1, 1], // antena, haste
  [2, 2, 8, 6], // cabeça
]
const TRONCO: readonly Celula[] = [
  [5, 8, 2, 1], // pescoço
  [3, 9, 6, 4], // tronco
  [1, 9, 2, 3], // braço esquerdo
]
const BRACO_DIREITO: Celula = [9, 9, 2, 3]
const PERNAS: readonly Celula[] = [
  [3, 13, 2, 1], // perna esquerda
  [7, 13, 2, 1], // perna direita
]
const OLHOS: readonly Celula[] = [
  [4, 4, 1, 1],
  [7, 4, 1, 1],
]
const BOCA: Celula = [4, 6, 4, 1]
const PEITO: Celula = [5, 10, 2, 1]

export type Variante = 'passeio' | 'pousado' | 'acenando' | 'boot'

const Retangulos = ({ celulas, className }: { celulas: readonly Celula[]; className?: string }) => (
  <>
    {celulas.map(([x, y, w, h]) => (
      <rect key={`${x}-${y}`} className={className} x={x} y={y} width={w} height={h} />
    ))}
  </>
)

export function Robo({ variante, className = '' }: { variante: Variante; className?: string }) {
  return (
    <svg
      className={`sinapse-robo sinapse-robo-${variante} ${className}`}
      viewBox="0 0 12 14"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <g className="sinapse-robo-pernas" fill="currentColor">
        {PERNAS.map(([x, y, w, h], i) => (
          <rect
            key={`perna-${i}`}
            className={`sinapse-robo-perna sinapse-robo-perna-${i === 0 ? 'e' : 'd'}`}
            x={x}
            y={y}
            width={w}
            height={h}
          />
        ))}
      </g>
      <g className="sinapse-robo-tronco" fill="currentColor">
        <Retangulos celulas={TRONCO} />
        <rect className="sinapse-robo-peito" x={PEITO[0]} y={PEITO[1]} width={PEITO[2]} height={PEITO[3]} />
      </g>
      <g className="sinapse-robo-braco" fill="currentColor">
        <rect x={BRACO_DIREITO[0]} y={BRACO_DIREITO[1]} width={BRACO_DIREITO[2]} height={BRACO_DIREITO[3]} />
      </g>
      <g className="sinapse-robo-cabeca" fill="currentColor">
        <Retangulos celulas={CABECA} />
        <g className="sinapse-robo-olhos">
          <Retangulos celulas={OLHOS} className="sinapse-robo-olho" />
        </g>
        <rect className="sinapse-robo-boca" x={BOCA[0]} y={BOCA[1]} width={BOCA[2]} height={BOCA[3]} />
      </g>
    </svg>
  )
}
