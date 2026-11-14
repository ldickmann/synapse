import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { metadataBase } from '@/lib/metadados'
import './globals.css'

export const metadata: Metadata = {
  metadataBase,
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
