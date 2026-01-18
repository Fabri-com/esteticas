'use client'

import Link from 'next/link'

export default function Footer(){
  return (
    <footer className="mt-16 border-t bg-pink-50/40">
      <div className="container py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-pink-500 text-white grid place-items-center">✿</div>
            <div className="font-semibold">Beauty Salon</div>
          </div>
          <p className="text-gray-600">Tu centro de belleza de confianza. Servicios profesionales y productos de calidad.</p>
        </div>
        <div>
          <div className="font-medium mb-2">Navegación</div>
          <ul className="space-y-1 text-gray-700">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/services">Servicios</Link></li>
            <li><Link href="/productos">Productos</Link></li>
            <li><Link href="/academy">Academia</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Contacto</div>
          <ul className="space-y-1 text-gray-700">
            <li>+54 11 1234-5678</li>
            <li>info@beautysalon.com</li>
            <li>Av. Principal 123, CABA</li>
            <li>Lun - Sáb: 9:00 - 19:00</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Redes Sociales</div>
          <div className="flex items-center gap-3 text-pink-600">
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white border grid place-items-center">⌁</a>
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white border grid place-items-center">f</a>
            <a href="#" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white border grid place-items-center">☎</a>
            <a href="#" aria-label="Email" className="w-9 h-9 rounded-full bg-white border grid place-items-center">✉</a>
          </div>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Beauty Salon. Todos los derechos reservados.</div>
    </footer>
  )
}
