'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Icon({ name, className = 'w-4 h-4 text-pink-600' }: { name: string; className?: string }){
  switch (name) {
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      )
    case 'hourglass':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M6 2h12M6 22h12"/><path d="M7 2c0 5 5 6 5 10s-5 5-5 10"/><path d="M17 2c0 5-5 6-5 10s5 5 5 10"/></svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      )
    case 'teacher':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M2 7l10-5 10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      )
    case 'certificate':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><circle cx="12" cy="8" r="5"/><path d="M8 15l-2 7 6-3 6 3-2-7"/></svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4v15.5A2.5 2.5 0 0 0 6.5 22H20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/></svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><path d="M20 6L9 17l-5-5"/></svg>
      )
    case 'gift':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12"/><path d="M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8Z"/><path d="M12 8h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z"/></svg>
      )
    default:
      return null
  }
}

export default function CourseDetail({ params }: { params: { id: string } }){
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [c, setC] = useState<any>(null)

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('courses')
        .select('id,title,level,duration_weeks,students,seats,seats_available,price,mode,image_url,description,start_date,schedule_text,teacher,certificate_included,program_md,requirements_md,includes_md, course_categories(name)')
        .eq('id', id)
        .maybeSingle()
      if (!data) { setC(null); setLoading(false); return }
      const catName = Array.isArray((data as any)?.course_categories)
        ? (data as any).course_categories[0]?.name
        : (data as any)?.course_categories?.name
      setC({
        id: data.id,
        title: data.title,
        level: data.level,
        duration_weeks: data.duration_weeks,
        students: data.students,
        seats: data.seats,
        seats_available: data.seats_available,
        price: data.price,
        mode: data.mode,
        image_url: data.image_url,
        description: data.description,
        start_date: data.start_date,
        schedule_text: data.schedule_text,
        teacher: data.teacher,
        certificate_included: !!data.certificate_included,
        program_md: data.program_md,
        requirements_md: data.requirements_md,
        includes_md: data.includes_md,
        category_name: catName || undefined,
      })
      setLoading(false)
    }
    run()
  }, [id])

  const formatPrice = (n?: number | null) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
  const formatDate = (iso?: string | null) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return null }
  }

  const waText = useMemo(() => {
    if (!c) return ''
    const parts = [`Hola! Me interesa el curso "${c.title}"`]
    if (c.level) parts.push(`Nivel: ${c.level}`)
    if (c.mode) parts.push(`Modalidad: ${c.mode}`)
    if (c.start_date) parts.push(`Inicio: ${formatDate(c.start_date)}`)
    if (c.schedule_text) parts.push(`Horarios: ${c.schedule_text}`)
    return encodeURIComponent(parts.join(' · ') + '. ¿Podrían darme más info?')
  }, [c])

  if (loading) return <div className="text-sm text-gray-500">Cargando…</div>
  if (!c) return <div className="text-sm text-gray-500">Curso no encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="relative w-full h-[220px] md:h-[280px] rounded-xl overflow-hidden">
        {c.image_url ? (
          <Image src={c.image_url} alt={c.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400 bg-gray-100">Sin imagen</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/10" />
      </div>

      <div className="max-w-5xl mx-auto">
        <Link href="/academy" className="text-sm text-pink-600">← Volver a cursos</Link>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {c.level && <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">{c.level}</span>}
              {c.mode && <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">{c.mode}</span>}
              {c.certificate_included && <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">Certificado</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">{c.title}</h1>
          </div>

          {c.description && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2 flex items-center gap-2"><Icon name="book" /> <span>Sobre el curso</span></div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.description}</div>
            </div>
          )}

          {c.program_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2 flex items-center gap-2"><Icon name="list" /> <span>Programa del curso</span></div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.program_md}</div>
            </div>
          )}

          {c.requirements_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2 flex items-center gap-2"><Icon name="check" /> <span>Requisitos</span></div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.requirements_md}</div>
            </div>
          )}

          {c.includes_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2 flex items-center gap-2"><Icon name="gift" /> <span>Qué incluye el curso</span></div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.includes_md}</div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="rounded-xl border bg-white p-5 space-y-4">
              <div>
                <div className="text-2xl font-semibold text-pink-600">{formatPrice(c.price)}</div>
                <div className="text-xs text-gray-500">Pago único o en cuotas</div>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="space-y-3 text-sm text-gray-700">
                {c.start_date && (
                  <div className="flex items-start gap-2"><Icon name="calendar" /><div><div className="text-gray-500 text-xs">Inicio</div><div>{formatDate(c.start_date)}</div></div></div>
                )}
                {c.schedule_text && (
                  <div className="flex items-start gap-2"><Icon name="clock" /><div><div className="text-gray-500 text-xs">Horarios</div><div>{c.schedule_text}</div></div></div>
                )}
                {c.duration_weeks!=null && (
                  <div className="flex items-start gap-2"><Icon name="hourglass" /><div><div className="text-gray-500 text-xs">Duración</div><div>{c.duration_weeks} semanas</div></div></div>
                )}
                {(c.seats!=null || c.seats_available!=null) && (
                  <div className="flex items-start gap-2"><Icon name="users" /><div><div className="text-gray-500 text-xs">Cupos disponibles</div><div>{c.seats_available!=null ? c.seats_available : '-'}{c.seats!=null ? ` de ${c.seats} lugares` : ''}</div></div></div>
                )}
                {c.teacher && (
                  <div className="flex items-start gap-2"><Icon name="teacher" /><div><div className="text-gray-500 text-xs">Profesor</div><div>{c.teacher}</div></div></div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <a href={`https://wa.me/?text=${waText}`} target="_blank" className="w-full block text-center px-4 py-2 rounded bg-pink-500 text-white">Inscribirme ahora</a>
                <a href={`https://wa.me/?text=${encodeURIComponent('Hola! Quiero más información sobre el curso '+c.title)}`} target="_blank" className="w-full block text-center px-4 py-2 rounded border">Solicitar información</a>
              </div>

              {c.certificate_included && (
                <div className="rounded-lg bg-gradient-to-r from-pink-50 to-white border border-pink-100 p-3 text-sm text-pink-800 flex items-start gap-2">
                  <Icon name="certificate" className="w-5 h-5 text-pink-600" />
                  <div>
                    <div className="font-medium">Certificado incluido</div>
                    <div className="text-pink-700/90">Recibirás un certificado oficial avalado al completar el curso</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
