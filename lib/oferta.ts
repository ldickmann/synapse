// Fatos da oferta (SPEC §1). O tom fica nos textos da página, em lib/texto.ts.

export type Servico = 'site' | 'sistema' | 'manutencao'

export const SERVICOS: readonly { id: Servico; nome: string }[] = [
  { id: 'site', nome: 'Site institucional ou landing page' },
  { id: 'sistema', nome: 'Sistema ou painel sob medida' },
  { id: 'manutencao', nome: 'Manutenção e evolução de site que já existe' },
]

export const REGIAO = {
  presencial: 'Navegantes e região',
  distancia: 'todo o Brasil',
} as const

export const ATENDIMENTO = 'Direto, sem intermediário: quem conversa é quem constrói'
export const REUNIAO_PRESENCIAL = true

// PENDENTES (SPEC §9). Enquanto forem null, a frase correspondente não é renderizada.
export const ANOS_EXPERIENCIA: number | null = null
export const FORMACAO: string | null = null

/** Linhas condicionais do "Sobre mim", só com os dados que existem. */
export function linhasCondicionais(): string[] {
  const linhas: string[] = []
  if (ANOS_EXPERIENCIA !== null) linhas.push(`Trabalho com sites há ${ANOS_EXPERIENCIA} anos.`)
  if (FORMACAO !== null) linhas.push(`${FORMACAO}.`)
  return linhas
}

export type Pergunta = { pergunta: string; resposta: string }

// As duas últimas aguardam confirmação do Lucas (SPEC §9).
export const PERGUNTAS: readonly Pergunta[] = [
  {
    pergunta: 'Não entendo de tecnologia. Tem problema?',
    resposta:
      'Não. Você me conta do seu negócio e eu cuido da parte técnica. A gente conversa em português claro, sem termos difíceis.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'Depende do que o seu negócio precisa. Me chama no WhatsApp, eu entendo o caso e te passo um orçamento.',
  },
  {
    pergunta: 'Você atende fora de Navegantes?',
    resposta: 'Sim. Em Navegantes e região eu vou até você. Para outras cidades, atendo à distância.',
  },
  {
    pergunta: 'O site funciona bem no celular?',
    resposta: 'Sim. Eu faço pensando no celular primeiro, porque é onde a maioria dos clientes abre.',
  },
  {
    pergunta: 'Preciso ter domínio e hospedagem antes?',
    resposta: 'Não precisa ter antes. Eu oriento o que contratar e deixo tudo configurado.',
  },
  {
    pergunta: 'Posso mudar textos e fotos depois?',
    resposta:
      'Sim. No começo definimos o que você vai precisar alterar sozinho e eu preparo o site para isso.',
  },
]
