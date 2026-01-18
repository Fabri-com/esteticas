'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Header(){
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])
  
  useEffect(() => {
    const supabase = createClient()
    let timer: any
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await supabase.auth.signOut()
        setLoggedIn(false)
      }, 30 * 60 * 1000)
    }
    const events = ['mousemove','keydown','touchstart','scroll','click'] as const
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach(ev => window.removeEventListener(ev, reset))
    }
  }, [])
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
          {loggedIn && <Link href="/admin" className="text-gray-600 text-sm hover:underline">Dashboard</Link>}
          {loggedIn ? (
            <button onClick={async()=>{ const supabase = createClient(); await supabase.auth.signOut(); setLoggedIn(false) }} className="text-gray-500 text-sm">Cerrar sesión</button>
          ) : (
            <Link href="/admin/login" className="text-gray-500 text-sm">Iniciar sesión</Link>
          )}
        </div>

        {/* Mobile quick links + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/services" className="text-sm">Servicios</Link>
          <Link href="/productos" className="text-sm">Productos</Link>
          <Link href="/booking" className="px-3 py-1 rounded bg-pink-500 text-white text-sm">Reservar</Link>
          <button aria-label="Menú" className="p-2 border rounded" onClick={()=>setOpen(v=>!v)}>☰</button>
        </div>
      </nav>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-2 flex flex-col text-sm">
            <Link href="/" className="py-2" onClick={()=>setOpen(false)}>Inicio</Link>
            <Link href="/academy" className="py-2" onClick={()=>setOpen(false)}>Academia</Link>
            <Link href="/contacto" className="py-2" onClick={()=>setOpen(false)}>Contacto</Link>
            {loggedIn && <Link href="/admin" className="py-2" onClick={()=>setOpen(false)}>Dashboard</Link>}
            {loggedIn ? (
              <button className="py-2 text-left" onClick={async()=>{ const supabase = createClient(); await supabase.auth.signOut(); setLoggedIn(false); setOpen(false) }}>Cerrar sesión</button>
            ) : (
              <Link href="/admin/login" className="py-2" onClick={()=>setOpen(false)}>Iniciar sesión</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
