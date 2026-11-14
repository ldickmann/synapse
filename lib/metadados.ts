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

export const descricaoPadrao =
  'Faço sites, sistemas sob medida e manutenção, em Navegantes e à distância para todo o Brasil.'

export function metadadosDaRota(titulo: string, descricao: string, rota: string): Metadata {
  return {
    metadataBase,
    title: titulo,
    description: descricao,
    alternates: { canonical: rota },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: NOME_COMPLETO,
      url: rota,
      title: titulo,
      description: descricao,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
    },
  }
}
