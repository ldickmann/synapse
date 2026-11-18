// Todas as strings do site. Os fatos vêm dos outros arquivos de lib/.
import { NUMERO_WHATSAPP } from './contato'
import { CIDADE, MUNICIPIO, NOME_COMPLETO } from './marca'
import { ATENDIMENTO, REGIAO, type Servico } from './oferta'

/** O nome gigante do hero, uma palavra por linha. */
export const NOME_GIGANTE: readonly string[] = NOME_COMPLETO.split(' ')

export const PAPEIS: readonly string[] = ['Front-end', 'Sites', 'Sistemas', 'Manutenção', MUNICIPIO]

export const H1 = `Faço o site do seu negócio em ${MUNICIPIO}.`
export const APOIO = `Site, sistema sob medida ou manutenção do que já existe. Atendo em ${REGIAO.presencial}, e à distância em ${REGIAO.distancia}.`
export const BOTAO_WHATSAPP = 'Chamar no WhatsApp'

export const NAV: readonly { href: string; rotulo: string }[] = [
  { href: '#servicos', rotulo: 'Serviços' },
  { href: '#trabalhos', rotulo: 'Trabalhos' },
  { href: '#quem', rotulo: 'Quem' },
  { href: '#perguntas', rotulo: 'Perguntas' },
  { href: '#contato', rotulo: 'Contato' },
]

export const BOOT_TEXTO = 'iniciando sinapses'

export const SOBRE_TITULO = 'Quem faz'
export const SOBRE_PARAGRAFOS: readonly string[] = [
  `${NOME_COMPLETO}, desenvolvedor front-end em ${CIDADE}.`,
  `${ATENDIMENTO}.`,
  `Em ${REGIAO.presencial} eu vou até você. Para ${REGIAO.distancia}, atendo à distância.`,
]

/** Blumenau, SC: as coordenadas que o modelo mostra antes do telefone. */
export const COORDENADAS = { lat: '-26.9189', lon: '-49.0658' } as const

/** 5547988420692 vira +55 (47) 98842-0692. */
export function numeroFormatado(numero: string = NUMERO_WHATSAPP): string {
  const pais = numero.slice(0, 2)
  const ddd = numero.slice(2, 4)
  const resto = numero.slice(4)
  return `+${pais} (${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`
}

export const SERVICOS_TITULO = 'Serviços'
export const SERVICOS_APOIO =
  'Você me conta do negócio; a rede decide o que entregar. Passe sobre um serviço e o robô liga a rede.'
export const SERVICOS_LINHAS: Readonly<Record<Servico, string>> = {
  site: 'Carrega rápido, funciona no celular e diz o que você faz e como falar com você.',
  sistema: 'Um painel ou sistema feito para o jeito que o seu negócio trabalha.',
  manutencao: 'Se o site já existe, eu cuido dele: correções, melhorias e novas páginas.',
}

export const FRASE_GIGANTE = `${ATENDIMENTO}.`

export const TRABALHOS_TITULO = 'Trabalhos'
export const TRABALHOS_APOIO = 'Sites que já estão no ar. Toque para abrir numa aba nova.'
export const TRABALHOS_LINK = 'Abrir o site'

export const PERGUNTAS_TITULO = 'Perguntas que sempre aparecem'

export const CONTATO_TITULO = 'Contato'
export const CONTATO_TEXTO = 'Me conta o que o seu negócio precisa. Eu respondo pelo WhatsApp.'
export const RODAPE = `${NOME_COMPLETO}, desenvolvedor front-end. ${CIDADE}.`

/** Trechos de script que flutuam atrás do texto (decorativos, aria-hidden). "01000100 01001100 01001011" é DLK em ASCII. */
export const TRECHOS: readonly string[][] = [
  ['const disparar = (x) =>', '  x > limiar ? x : 0', 'rede.camadas.map(disparar)'],
  ['01000100 01001100 01001011', 'peso += taxa * erro', 'while (erro > 0.01) treinar()'],
  ['fetch("/orcamento")', '  .then(ler)', '  .then(responder)'],
]
