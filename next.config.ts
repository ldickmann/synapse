import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  // Libera o servidor de desenvolvimento para o celular na rede local (pnpm dev:rede).
  allowedDevOrigins: ['192.168.1.*'],
}

export default bundleAnalyzer({ enabled: process.env.ANALYZE === '1' })(config)
