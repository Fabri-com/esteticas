import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import CourseForm from './course-form'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminAcademyPage({ searchParams }: { searchParams?: { edit?: string } }){
  const supabase = await requireAdmin()
  const { data: courses } = await supabase
    .from('courses')
    .select('id,title,level,price,mode,course_categories(name),image_url,category_id')
    .order('title')
  const { data: categories } = await supabase
    .from('course_categories')
    .select('id,name')
    .order('name')

  let initial: any = null
  if (searchParams?.edit) {
    const { data } = await supabase
      .from('courses')
      .select('id,title,level,duration_weeks,students,seats,price,mode,image_url,description,category_id')
      .eq('id', searchParams.edit)
      .maybeSingle()
    initial = data || null
  }

  async function createCategory(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const name = String(fd.get('new_category_name') || '').trim()
    if (!name) return { error: 'Ingresá un nombre' }
    const { error } = await supabase.from('course_categories').insert({ name })
    if (error) return { error: error.message }
    revalidatePath('/admin/academy')
    return { success: true }
  }

  async function upsertCourse(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const idRaw = String(fd.get('id') || '')
    const base: any = {
      title: String(fd.get('title') || ''),
      category_id: (fd.get('category_id') || '').toString().trim() || null,
      level: String(fd.get('level') || ''),
      duration_weeks: fd.get('duration_weeks') ? Number(fd.get('duration_weeks')) : null,
      students: fd.get('students') ? Number(fd.get('students')) : null,
      seats: fd.get('seats') ? Number(fd.get('seats')) : null,
      seats_available: fd.get('seats_available') ? Number(fd.get('seats_available')) : null,
      price: fd.get('price') ? Number(fd.get('price')) : null,
      mode: String(fd.get('mode') || ''),
      description: String(fd.get('description') || ''),
      start_date: fd.get('start_date') ? String(fd.get('start_date')) : null,
      schedule_text: String(fd.get('schedule_text') || ''),
      teacher: String(fd.get('teacher') || ''),
      certificate_included: fd.get('certificate_included') === 'on',
      program_md: String(fd.get('program_md') || ''),
      requirements_md: String(fd.get('requirements_md') || ''),
      includes_md: String(fd.get('includes_md') || ''),
    }
    // Structured JSON fields (optional)
    const pj = String(fd.get('program_json') || '').trim()
    const rj = String(fd.get('requirements_json') || '').trim()
    const ij = String(fd.get('includes_json') || '').trim()
    try { base.program_json = pj ? JSON.parse(pj) : null } catch {}
    try { base.requirements_json = rj ? JSON.parse(rj) : null } catch {}
    try { base.includes_json = ij ? JSON.parse(ij) : null } catch {}
    const file = fd.get('image_file') as File | null
    if (file && typeof file === 'object' && 'arrayBuffer' in file && (file as File).size > 0) {
      const ab = await (file as File).arrayBuffer()
      const ext = (file as File).type?.split('/')?.[1] || 'jpg'
      const path = `${randomUUID()}.${ext}`
      const bucket = supabase.storage.from('course-images')
      const { error: upErr } = await bucket.upload(path, Buffer.from(ab), { contentType: (file as File).type || 'image/jpeg', upsert: true })
      if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` }
      const pub = bucket.getPublicUrl(path)
      base.image_url = pub.data.publicUrl
    }
    const payload = idRaw ? { id: idRaw, ...base } : base
    const { error } = await supabase.from('courses').upsert(payload)
    if (error) return { error: error.message }
    revalidatePath('/admin/academy')
    return { success: true }
  }

  async function deleteCourse(fd: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(fd.get('id') || '')
    if (!id) return
    await supabase.from('courses').delete().eq('id', id)
    revalidatePath('/admin/academy')
    redirect('/admin/academy')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Academia</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn">Volver al Dashboard</Link>
        </div>
      </div>

      <CourseForm categories={categories || []} initial={initial} action={upsertCourse} createCategory={createCategory} />

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
              <a href={`/admin/academy?edit=${c.id}`} className="rounded-md border px-3 py-1.5 text-sm">Editar</a>
              <form action={deleteCourse}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn bg-gray-900 hover:bg-black">Eliminar</button>
              </form>
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
