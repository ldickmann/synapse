import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const config: NextConfig = {
  // Exportação estática: o next build gera out/, a pasta que o Cloudflare Pages publica e que o pnpm start
  // (scripts/servir.ts) serve nos testes. Nada que precise de servidor (docs/decisoes/0002).
  output: 'export',
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  // Libera o servidor de desenvolvimento para o celular na rede local (pnpm dev:rede).
  allowedDevOrigins: ['192.168.1.*'],
}

export default bundleAnalyzer({ enabled: process.env.ANALYZE === '1' })(config)
