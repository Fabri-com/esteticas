'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
              <div className="font-medium mb-2">Sobre el curso</div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.description}</div>
            </div>
          )}

          {c.program_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2">Programa del curso</div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.program_md}</div>
            </div>
          )}

          {c.requirements_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2">Requisitos</div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{c.requirements_md}</div>
            </div>
          )}

          {c.includes_md && (
            <div className="rounded-xl border bg-white p-5">
              <div className="font-medium mb-2">Qué incluye el curso</div>
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
                  <div className="flex items-start gap-2"><span>📅</span><div><div className="text-gray-500 text-xs">Inicio</div><div>{formatDate(c.start_date)}</div></div></div>
                )}
                {c.schedule_text && (
                  <div className="flex items-start gap-2"><span>⏰</span><div><div className="text-gray-500 text-xs">Horarios</div><div>{c.schedule_text}</div></div></div>
                )}
                {c.duration_weeks!=null && (
                  <div className="flex items-start gap-2"><span>🕑</span><div><div className="text-gray-500 text-xs">Duración</div><div>{c.duration_weeks} semanas</div></div></div>
                )}
                {(c.seats!=null || c.seats_available!=null) && (
                  <div className="flex items-start gap-2"><span>👥</span><div><div className="text-gray-500 text-xs">Cupos disponibles</div><div>{c.seats_available!=null ? c.seats_available : '-'}{c.seats!=null ? ` de ${c.seats} lugares` : ''}</div></div></div>
                )}
                {c.teacher && (
                  <div className="flex items-start gap-2"><span>🎓</span><div><div className="text-gray-500 text-xs">Profesor</div><div>{c.teacher}</div></div></div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <a href={`https://wa.me/?text=${waText}`} target="_blank" className="w-full block text-center px-4 py-2 rounded bg-pink-500 text-white">Inscribirme ahora</a>
                <a href={`https://wa.me/?text=${encodeURIComponent('Hola! Quiero más información sobre el curso '+c.title)}`} target="_blank" className="w-full block text-center px-4 py-2 rounded border">Solicitar información</a>
              </div>

              {c.certificate_included && (
                <div className="rounded-lg bg-pink-50 border border-pink-100 p-3 text-sm text-pink-800">
                  <div className="font-medium mb-1">Certificado incluido</div>
                  <div>Recibirás un certificado oficial avalado al completar el curso</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
