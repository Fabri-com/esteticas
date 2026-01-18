'use client'

import Image from 'next/image'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Inmersivo'
  weeks: number
  students: number
  seats: number
  price: number
  mode: 'Presencial' | 'Online'
  image?: string
}

const courses: Course[] = [
  { id: 'manicura', title: 'Manicura Profesional', level: 'Principiante', weeks: 6, students: 427, seats: 38, price: 45000, mode: 'Presencial', image: '/images/academy-manicura.jpg' },
  { id: 'pestanas', title: 'Extensión de Pestañas', level: 'Inmersivo', weeks: 5, students: 150, seats: 26, price: 52000, mode: 'Presencial', image: '' },
  { id: 'faciales', title: 'Tratamientos Faciales', level: 'Avanzado', weeks: 10, students: 318, seats: 30, price: 65000, mode: 'Presencial', image: '/images/academy-faciales.jpg' },
]

const formatPrice = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function AcademyPage(){
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-10 bg-pink-50/50 rounded-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="text-3xl">🎓</div>
          <h1 className="text-3xl md:text-4xl font-semibold">Academia de Belleza Profesional</h1>
          <p className="text-gray-600">Formación de excelencia en estética y belleza. Convertí tu pasión en tu profesión con nuestros cursos certificados.</p>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-4 gap-4">
        {[
          { t: 'Certificado Oficial', d: 'Al finalizar recibís tu certificado avalado' },
          { t: 'Grupos Reducidos', d: 'Máximo 12 estudiantes para atención personalizada' },
          { t: 'Material Incluido', d: 'Todo el material de estudio y práctica incluido' },
          { t: 'Profesores Expertos', d: 'Instructores con años de experiencia en el rubro' },
        ].map((f, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 text-center">
            <div className="text-2xl mb-2 text-pink-600">✦</div>
            <div className="font-medium">{f.t}</div>
            <div className="text-gray-600 text-sm">{f.d}</div>
          </div>
        ))}
      </section>

      {/* Cursos */}
      <section className="space-y-3">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Nuestros Cursos</h2>
          <p className="text-gray-500 text-sm">Elegí el curso que más se adapte a tus objetivos y comenzá tu camino</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="rounded-xl overflow-hidden border bg-white">
              <div className="aspect-[16/9] bg-gray-100 relative">
                {c.image ? (
                  <Image src={c.image} alt={c.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400">Sin imagen</div>
                )}
                <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-white/95 border text-gray-700">{c.level}</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-gray-500 flex items-center gap-3">
                  <span>⏱ {c.weeks} semanas</span>
                  <span>👥 {c.students} estudiantes</span>
                  <span>🎟 {c.seats} cupos</span>
                </div>
                <div className="text-pink-600 font-semibold">{formatPrice(c.price)}</div>
                <div className="flex gap-2 pt-1">
                  <Link href={`#`} className="px-3 py-1 rounded border text-sm">Ver detalles</Link>
                  <a href={`https://wa.me/`} target="_blank" className="px-3 py-1 rounded bg-pink-500 text-white text-sm">Consultar</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-10 bg-pink-50/50 rounded-xl space-y-4">
        <div className="text-3xl">🎓</div>
        <div className="text-lg">¿Tenés dudas sobre nuestros cursos?</div>
        <p className="text-gray-600 max-w-2xl mx-auto">Nuestro equipo está disponible para asesorarte y ayudarte a elegir el mejor curso para vos</p>
        <div className="flex items-center justify-center gap-3">
          <a href="https://wa.me/" target="_blank" className="px-4 py-2 rounded bg-pink-500 text-white">Contactanos</a>
          <a href="#" className="px-4 py-2 rounded border">Descargar plan de estudios</a>
        </div>
      </section>
    </div>
  )
}
