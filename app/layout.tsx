import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estética',
  description: 'Servicios de estética y academia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b">
          <nav className="container h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold">Estética</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/services">Servicios</Link>
              <Link href="/booking" className="btn py-1">Reservar</Link>
              <Link href="/academy">Academia</Link>
              <Link href="/admin" className="text-gray-500">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t mt-16">
          <div className="container py-8 text-sm text-gray-500">© {new Date().getFullYear()} Estética</div>
        </footer>
      </body>
    </html>
  )
}
