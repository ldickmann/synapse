import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

// O build de verificação (window.__verificacao) fica em pasta própria para não
// se misturar com o build medido pelo Lighthouse e pelo orçamento de JS.
const verificacao = process.env.NEXT_PUBLIC_VERIFICACAO === '1'

const config: NextConfig = {
  transpilePackages: ['three'],
  distDir: verificacao ? '.next-verificacao' : '.next',
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  // Libera o servidor de desenvolvimento para o celular na rede local (pnpm dev:rede).
  allowedDevOrigins: ['192.168.1.*'],
}

export default bundleAnalyzer({ enabled: process.env.ANALYZE === '1' })(config)
