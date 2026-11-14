import type { Metadata } from 'next'
import { NOME_COMPLETO } from './marca'

// Endereço público do site, para og:url, og:image e canonical absolutos.
// Ordem: NEXT_PUBLIC_SITE_URL (sobrescrita, ex.: domínio próprio) → variáveis de
// sistema da Vercel (vêm sem protocolo; produção usa o endereço fixo do projeto e
// o preview usa o da branch) → servidor local.
function enderecoDoSite(): string {
  const fixo = process.env.NEXT_PUBLIC_SITE_URL
  if (fixo) return fixo
  const vercel =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  return vercel ? `https://${vercel}` : 'http://localhost:3000'
}

export const metadataBase = new URL(enderecoDoSite())

// Título provisório: o texto final fica para a fase de conteúdo.
const TITULO = NOME_COMPLETO
const DESCRICAO = 'Faço sites, sistemas sob medida e manutenção, em Navegantes e à distância para todo o Brasil.'

/** Metadados de `/`, exportados por app/page.tsx; o layout raiz só define o metadataBase e o ícone. */
export const metadadosDaPagina: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: NOME_COMPLETO,
    url: '/',
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRICAO,
  },
}
