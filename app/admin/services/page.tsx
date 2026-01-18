import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import ServiceForm from './service-form'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminServicesPage({ searchParams }: { searchParams?: { edit?: string } }){
  const supabase = await requireAdmin()
  const { data: services } = await supabase.from('services').select('*').order('name')
  const { data: categories } = await supabase.from('service_categories').select('*').order('name')
  let initialService: any = null
  if (searchParams?.edit) {
    const { data } = await supabase.from('services').select('*').eq('id', searchParams.edit).single()
    initialService = data || null
  }

  async function upsertService(_: any, formData: FormData) {
    'use server'
    const supabase = createClient()
    const idRaw = (formData.get('id') || '').toString().trim()
    const hasId = idRaw.length > 0
    const hhmm = String(formData.get('duration_hhmm') || '00:00')
    const [hStr = '0', mStr = '0'] = hhmm.split(':')
    const duration_minutes = (parseInt(hStr || '0', 10) || 0) * 60 + (parseInt(mStr || '0', 10) || 0)
    const base = {
      name: String(formData.get('name')),
      category: String(formData.get('category') || ''),
      category_id: (formData.get('category_id') || '').toString().trim() || null,
      duration_minutes,
      price: parseFloat(String(formData.get('price') || '0')),
      description: String(formData.get('description') || ''),
      image_url: String(formData.get('image_url') || ''),
      includes: (String(formData.get('includes') || '')
        .split(/\r?\n/) // split lines
        .map(s => s.trim())
        .filter(Boolean)) as unknown as string[],
      gallery_urls: [] as string[],
      is_active: Boolean(formData.get('is_active')),
    }
    // Handle optional file upload to Supabase Storage
    const file = formData.get('image_file') as File | null
    if (file && typeof file === 'object' && 'arrayBuffer' in file && (file as File).size > 0) {
      const ab = await (file as File).arrayBuffer()
      const ext = (file as File).type?.split('/')?.[1] || 'jpg'
      const path = `${randomUUID()}.${ext}`
      const bucket = supabase.storage.from('service-images')
      const { error: upErr } = await bucket.upload(path, Buffer.from(ab), {
        contentType: (file as File).type || 'image/jpeg',
        upsert: true,
      })
      if (!upErr) {
        const pub = bucket.getPublicUrl(path)
        base.image_url = pub.data.publicUrl
      }
    }

    // Optional multiple gallery files
    const gallery = formData.getAll('gallery_files') as File[]
    if (Array.isArray(gallery) && gallery.length) {
      for (const gf of gallery) {
        if (!gf || !(gf as File).size) continue
        const ab = await (gf as File).arrayBuffer()
        const ext = (gf as File).type?.split('/')?.[1] || 'jpg'
        const path = `${randomUUID()}.${ext}`
        const bucket = supabase.storage.from('service-images')
        const { error: gErr } = await bucket.upload(path, Buffer.from(ab), {
          contentType: (gf as File).type || 'image/jpeg',
          upsert: true,
        })
        if (!gErr) {
          const pub = bucket.getPublicUrl(path)
          base.gallery_urls.push(pub.data.publicUrl)
        }
      }
    }
    const payload = hasId ? { id: idRaw, ...base } : base
    const { error } = await supabase.from('services').upsert(payload).select('id')
    if (error) {
      console.error('upsert service error', error.message)
      return { error: error.message }
    }
    revalidatePath('/admin/services')
    return { success: true }
  }

  async function deleteService(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('id'))
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) {
      console.error('delete service error', error.message)
      return
    }
    revalidatePath('/admin/services')
    redirect('/admin/services')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Servicios</h1>
      <ServiceForm categories={categories || []} action={upsertService} initial={initialService} />

      <div className="space-y-3">
        {services?.map(s => {
          const catName = categories?.find(c => c.id === s.category_id)?.name || s.category || '—'
          return (
            <div key={s.id} className="card grid md:grid-cols-8 gap-2 items-center">
              <div className="font-medium">{s.name}</div>
              <div>{catName}</div>
              <div>{s.duration_minutes}m</div>
              <div>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(s.price ?? 0))}</div>
              <div className="text-sm text-gray-600 md:col-span-3">{s.description}</div>
              <div className="flex items-center gap-2 justify-end">
                <a href={`/admin/services?edit=${s.id}`} className="rounded-md border px-3 py-1.5 text-sm">Editar</a>
                <form action={deleteService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="btn bg-gray-900 hover:bg-black">Eliminar</button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
