'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header(){
  const [open, setOpen] = useState(false)
  return (
    <header className="border-b">
      <nav className="container h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Estética</Link>
        {/* Desktop center nav */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/">Inicio</Link>
          <Link href="/services">Servicios</Link>
          <Link href="/productos">Productos</Link>
          <Link href="/academy">Academia</Link>
          <Link href="/contacto">Contacto</Link>
        </div>
        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/booking" className="px-3 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition-colors text-sm">Reservar turno</Link>
          <Link href="/admin/login" className="text-gray-500 text-sm">Iniciar sesión</Link>
        </div>

        {/* Mobile quick links + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/services" className="text-sm">Servicios</Link>
          <Link href="/productos" className="text-sm">Productos</Link>
          <Link href="/academy" className="text-sm">Academia</Link>
          <Link href="/booking" className="px-3 py-1 rounded bg-pink-500 text-white text-sm">Reservar</Link>
          <button aria-label="Menú" className="p-2 border rounded" onClick={()=>setOpen(v=>!v)}>☰</button>
        </div>
      </nav>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-2 flex flex-col text-sm">
            <Link href="/" className="py-2" onClick={()=>setOpen(false)}>Inicio</Link>
            <Link href="/contacto" className="py-2" onClick={()=>setOpen(false)}>Contacto</Link>
            <Link href="/admin/login" className="py-2" onClick={()=>setOpen(false)}>Iniciar sesión</Link>
          </div>
        </div>
      )}
    </header>
  )
}
