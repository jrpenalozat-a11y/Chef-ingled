import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medicación',
  description: 'Registro de dosis administradas en casa.',
  // Datos de salud de una persona real: fuera de buscadores.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: 'Medicación', statusBarStyle: 'default' },
  formatDetection: { telephone: false, date: false, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#EEF1F5',
  width: 'device-width',
  initialScale: 1,
  // Se usa con una mano y con sueño: que se pueda ampliar si hace falta.
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  )
}
