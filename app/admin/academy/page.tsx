import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminAcademyPage(){
  const supabase = await requireAdmin()
  const { data: courses } = await supabase
    .from('courses')
    .select('id,title,level,price,mode,course_categories(name),image_url')
    .order('title')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Academia</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn">Volver al Dashboard</Link>
        </div>
      </div>
      <div className="space-y-3">
        {(courses||[]).map((c: any) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              {c.image_url && <img src={c.image_url} alt={c.title} className="w-12 h-12 object-cover rounded" />}
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-gray-600">{Array.isArray(c.course_categories) ? c.course_categories[0]?.name : c.course_categories?.name} · {c.level} · {c.mode}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border px-3 py-1.5 text-sm" disabled>Editar</button>
              <button className="btn bg-gray-900 hover:bg-black" disabled>Eliminar</button>
            </div>
          </div>
        ))}
        {(!courses || courses.length === 0) && (
          <div className="text-sm text-gray-600">No hay cursos cargados.</div>
        )}
      </div>
    </div>
  )
}
