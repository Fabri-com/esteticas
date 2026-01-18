import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Estética',
  description: 'Servicios de estética y academia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main className="container py-8">{children}</main>
        <footer className="border-t mt-16">
          <div className="container py-8 text-sm text-gray-500">© {new Date().getFullYear()} Estética</div>
        </footer>
      </body>
    </html>
  )
}
