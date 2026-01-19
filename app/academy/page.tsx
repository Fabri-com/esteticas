'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DuoIcon from '@/components/ui/duo-icon'

type Course = {
  id: string
  title: string
  level?: string | null
  duration_weeks?: number | null
  students?: number | null
  seats?: number | null
  price?: number | null
  mode?: string | null
  image_url?: string | null
  category_name?: string | null
}

const formatPrice = (n?: number | null) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

export default function AcademyPage(){
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('courses')
        .select('id,title,level,duration_weeks,students,seats,price,mode,image_url, course_categories(name)')
        .order('title')
      const mapped: Course[] = (data||[]).map((c: any) => ({
        id: c.id,
        title: c.title,
        level: c.level,
        duration_weeks: c.duration_weeks,
        students: c.students,
        seats: c.seats,
        price: c.price,
        mode: c.mode,
        image_url: c.image_url,
        category_name: Array.isArray(c.course_categories) ? c.course_categories[0]?.name : c.course_categories?.name,
      }))
      setCourses(mapped)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-pink-50/50 rounded-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <DuoIcon name="certificate" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold">Academia de Belleza Profesional</h1>
          <p className="text-gray-600">Formación de excelencia en estética y belleza. Convertí tu pasión en tu profesión con nuestros cursos certificados.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Nuestros Cursos</h2>
          <p className="text-gray-500 text-sm">Elegí el curso que más se adapte a tus objetivos y comenzá tu camino</p>
        </div>
        {loading && <div className="text-sm text-gray-500">Cargando cursos…</div>}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl overflow-hidden border bg-white">
                <div className="aspect-[16/9] bg-gray-100 relative">
                  {c.image_url ? (
                    <Image src={c.image_url} alt={c.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-gray-400">Sin imagen</div>
                  )}
                  {c.level && <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-white/95 border text-gray-700">{c.level}</span>}
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                    {c.duration_weeks!=null && (
                      <span className="inline-flex items-center gap-1">
                        <DuoIcon name="hourglass" className="w-3.5 h-3.5" /> {c.duration_weeks} semanas
                      </span>
                    )}
                    {c.students!=null && (
                      <span className="inline-flex items-center gap-1">
                        <DuoIcon name="users" className="w-3.5 h-3.5" /> {c.students} estudiantes
                      </span>
                    )}
                    {c.seats!=null && (
                      <span className="inline-flex items-center gap-1">
                        <DuoIcon name="users" className="w-3.5 h-3.5" /> {c.seats} cupos
                      </span>
                    )}
                    {c.mode && (
                      <span className="inline-flex items-center gap-1">
                        <DuoIcon name="book" className="w-3.5 h-3.5" /> {c.mode}
                      </span>
                    )}
                  </div>
                  <div className="text-pink-600 font-semibold inline-flex items-center gap-1">
                    <DuoIcon name="money" className="w-4 h-4" /> {formatPrice(c.price)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/academy/${c.id}`} className="px-3 py-1 rounded border text-sm">Ver detalles</Link>
                    <a href={`https://wa.me/?text=${encodeURIComponent('Hola! Me interesa el curso '+c.title+'. ¿Podrían darme más info?')}`} target="_blank" className="px-3 py-1 rounded bg-pink-500 text-white text-sm">Consultar</a>
                  </div>
                </div>
              </div>
            ))}
            {!courses.length && <div className="text-sm text-gray-500">Próximamente cursos disponibles.</div>}
          </div>
        )}
      </section>
    </div>
  )
}
