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
          <nav className="container h-14 grid grid-cols-3 items-center">
            <div>
              <Link href="/" className="font-semibold">Estética</Link>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/">Inicio</Link>
              <Link href="/services">Servicios</Link>
              <Link href="/productos">Productos</Link>
              <Link href="/academy">Academia</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
            <div className="flex justify-end items-center gap-3">
              <Link href="/booking" className="px-3 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition-colors text-sm">Reservar turno</Link>
              <Link href="/admin/login" className="text-gray-500 text-sm">Iniciar sesión</Link>
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
