import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Nas cenas R3F, mutar objetos do three dentro de useFrame é o padrão da biblioteca.
    files: ['app/*/cena/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '.next-verificacao/**',
    'out/**',
    'verificacao/**',
    'next-env.d.ts',
    '.claude/**',
  ]),
])
