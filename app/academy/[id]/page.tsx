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
        .select('id,title,level,duration_weeks,students,seats,price,mode,image_url,description, course_categories(name)')
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
        price: data.price,
        mode: data.mode,
        image_url: data.image_url,
        description: data.description,
        category_name: catName || undefined,
      })
      setLoading(false)
    }
    run()
  }, [id])

  const formatPrice = (n?: number | null) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

  const waText = useMemo(() => {
    if (!c) return ''
    const parts = [`Hola! Me interesa el curso "${c.title}"`]
    if (c.level) parts.push(`Nivel: ${c.level}`)
    if (c.mode) parts.push(`Modalidad: ${c.mode}`)
    return encodeURIComponent(parts.join(' · ') + '. ¿Podrían darme más info?')
  }, [c])

  if (loading) return <div className="text-sm text-gray-500">Cargando…</div>
  if (!c) return <div className="text-sm text-gray-500">Curso no encontrado.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/academy" className="text-sm text-pink-600">← Volver a Academia</Link>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border bg-white aspect-[4/3] relative">
          {c.image_url ? (
            <Image src={c.image_url} alt={c.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400">Sin imagen</div>
          )}
        </div>
        <div className="space-y-3">
          {c.category_name && <div className="text-xs text-gray-500">{c.category_name}</div>}
          <h1 className="text-2xl font-semibold">{c.title}</h1>
          <div className="text-pink-600 font-semibold">{formatPrice(c.price)}</div>
          <div className="text-sm text-gray-600 flex flex-wrap gap-3">
            {c.level && <span>🎓 {c.level}</span>}
            {c.duration_weeks!=null && <span>⏱ {c.duration_weeks} semanas</span>}
            {c.students!=null && <span>👥 {c.students} estudiantes</span>}
            {c.seats!=null && <span>🎟 {c.seats} cupos</span>}
            {c.mode && <span>🏫 {c.mode}</span>}
          </div>
          {c.description && (
            <div className="prose prose-sm max-w-none"><p>{c.description}</p></div>
          )}
          <div className="flex gap-2 pt-2">
            <a href={`https://wa.me/?text=${waText}`} target="_blank" className="px-3 py-2 rounded bg-pink-500 text-white">Consultar por WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  )
}
