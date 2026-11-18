import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Archivo_Black, Space_Grotesk } from 'next/font/google'
import { metadataBase } from '@/lib/metadados'
import './globals.css'
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

// Só o que vale para qualquer rota, até a de 404: título, descrição e canonical ficam em app/page.tsx.
export const metadata: Metadata = {
  metadataBase,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivoBlack.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
