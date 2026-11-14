export type Trabalho = {
  id: string
  nome: string
  tipo: string
  /** Caminho em public/trabalhos/ (4:3) ou null enquanto pendente. */
  imagem: string | null
  link: string | null
}

// Trabalhos reais entram aqui conforme o Lucas libera (SPEC §9); os dois últimos ainda são reservados.
export const TRABALHOS: Trabalho[] = [
  {
    id: 'maos-de-tesoura',
    nome: 'Mãos de Tesoura',
    tipo: 'Site de barbearia, com agenda de horários',
    imagem: '/trabalhos/maos-de-tesoura.png',
    link: 'https://ldickmann.github.io/maos-de-tesoura/',
  },
  { id: 'trabalho-2', nome: 'Trabalho 2', tipo: 'Tipo de projeto', imagem: null, link: null },
  { id: 'trabalho-3', nome: 'Trabalho 3', tipo: 'Tipo de projeto', imagem: null, link: null },
]

/** Só os trabalhos já liberados, com link. */
export const TRABALHOS_REAIS: Trabalho[] = TRABALHOS.filter((t) => t.link !== null)
