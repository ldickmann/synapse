import type { ReactNode } from 'react'
import { Archivo_Black, Space_Grotesk } from 'next/font/google'
import { descricaoPadrao, metadadosDaRota } from '@/lib/metadados'
import './tokens.css'
import './pagina.css'

// Display largo e pesado, como o do modelo; só tem o peso 400.
const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--fonte-sinapse-display',
})

// Texto: grotesca com desenho técnico e números tabulares, que serve também aos trechos de script.
const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--fonte-sinapse-texto',
})

export const metadata = metadadosDaRota('Sinapse', descricaoPadrao, '/sinapse')

export default function SinapseLayout({ children }: { children: ReactNode }) {
  return (
    <div data-estilo="sinapse" className={`${archivoBlack.variable} ${spaceGrotesk.variable}`}>
      {children}
    </div>
  )
}
