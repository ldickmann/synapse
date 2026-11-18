import type { Metadata } from 'next'
import { MUNICIPIO, NOME_COMPLETO } from './marca'

// Endereço público do site, para og:url, og:image e canonical absolutos. Entra no HTML no build.
// Ordem: NEXT_PUBLIC_SITE_URL (a produção no Cloudflare Pages, ou um domínio próprio) → CF_PAGES_URL (o endereço
// desta implantação, nos builds de preview do Pages) → servidor local.
function enderecoDoSite(): string {
  const fixo = process.env.NEXT_PUBLIC_SITE_URL
  if (fixo) return fixo
  // main é a produção (CONTRIBUTING.md). Sem o endereço fixo, o canonical apontaria para esta implantação.
  if (process.env.CF_PAGES_BRANCH === 'main') {
    throw new Error('Falta NEXT_PUBLIC_SITE_URL nas variáveis de produção do Cloudflare Pages.')
  }
  return process.env.CF_PAGES_URL || 'http://localhost:3000'
}

export const metadataBase = new URL(enderecoDoSite())

// Título provisório: o texto final fica para a fase de conteúdo.
const TITULO = NOME_COMPLETO
const DESCRICAO = `Faço sites, sistemas sob medida e manutenção, em ${MUNICIPIO} e à distância para todo o Brasil.`

/**
 * Metadados de `/`, exportados por app/page.tsx. O layout raiz só define o metadataBase; os ícones e o manifesto
 * vêm dos arquivos de app/.
 */
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
