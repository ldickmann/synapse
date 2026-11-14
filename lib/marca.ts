export const NOME_COMPLETO = 'Lucas Elias Dickmann'
export const NOME_CURTO = 'Lucas Dickmann'
export const CIDADE = 'Navegantes, SC'

/**
 * Monograma dLK: string `d` de um único path de traço contínuo, viewBox 0 0 64 64.
 *
 * Uma linha só, sem preenchimento: desce a haste do d, contorna o bojo, segue
 * até a base, vira no pé do L, sobe a haste do K e abre o braço e a perna.
 * O d e o L dividem a mesma haste; o pé do L leva à haste do K. Renderizar com
 * `fill="none"`, `stroke="currentColor"`, `strokeWidth={MONOGRAMA_TRACO}`,
 * `strokeLinecap` e `strokeLinejoin` = MONOGRAMA_TERMINACAO.
 */
export const MONOGRAMA_PATH =
  'M21 7 V45 a9 12 0 0 1 -18 0 a9 12 0 0 1 18 0 V57 H43 V7 V31 L61 8 L43 31 L61 57'
export const MONOGRAMA_VIEWBOX = '0 0 64 64'
/** Espessura do traço em unidades do viewBox (1,4 px a 16 px; 2,4 px a 28 px; 3,4 px a 40 px). */
export const MONOGRAMA_TRACO = 5.5
/** Terminação e junção do traço (`stroke-linecap` e `stroke-linejoin`). */
export const MONOGRAMA_TERMINACAO = 'round'
