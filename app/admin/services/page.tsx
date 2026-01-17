import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminServicesPage(){
  const supabase = await requireAdmin()
  const { data: services } = await supabase.from('services').select('*').order('name')
  const { data: categories } = await supabase.from('service_categories').select('*').order('name')

  async function upsertService(formData: FormData) {
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
      const { error: upErr } = await supabase.storage.from('service-images').upload(path, Buffer.from(ab), {
        contentType: (file as File).type || 'image/jpeg',
        upsert: true,
      })
      if (!upErr) {
        base.image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/${path}`
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
        const { error: gErr } = await supabase.storage.from('service-images').upload(path, Buffer.from(ab), {
          contentType: (gf as File).type || 'image/jpeg',
          upsert: true,
        })
        if (!gErr) {
          base.gallery_urls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/${path}`)
        }
      }
    }
    const payload = hasId ? { id: idRaw, ...base } : base
    const { error } = await supabase.from('services').upsert(payload).select('id')
    if (error) {
      // En un caso real podríamos propagar este error al UI.
      console.error('upsert service error', error.message)
      return
    }
    revalidatePath('/admin/services')
    redirect('/admin/services')
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
      <form action={upsertService} className="card grid md:grid-cols-7 gap-2 items-end" encType="multipart/form-data">
        <input name="name" placeholder="Nombre" className="border rounded px-2 py-1" required />
        <select name="category_id" className="border rounded px-2 py-1">
          <option value="">Sin categoría</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="category" placeholder="Categoría (texto opcional)" className="border rounded px-2 py-1" />
        <input name="duration_hhmm" type="time" step="60" placeholder="Duración" className="border rounded px-2 py-1" />
        <input name="price" type="number" placeholder="Precio" className="border rounded px-2 py-1" required />
        <div className="flex gap-2">
          <input name="image_url" placeholder="URL imagen (opcional)" className="border rounded px-2 py-1" />
          <input name="image_file" type="file" accept="image/*" className="border rounded px-2 py-1" />
        </div>
        <input name="description" placeholder="Descripción" className="border rounded px-2 py-1 md:col-span-2" />
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Incluye (una por línea)</label>
          <textarea name="includes" placeholder="Ej.:\n• Limado y forma de uñas\n• Tratamiento de cutículas" className="w-full border rounded px-2 py-1 min-h-[76px]" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Galería (múltiples imágenes)</label>
          <input name="gallery_files" type="file" accept="image/*" multiple className="border rounded px-2 py-1 w-full" />
        </div>
        <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Activo</label>
        <button className="btn md:col-start-7">Guardar</button>
      </form>

      <div className="space-y-3">
        {services?.map(s => {
          const catName = categories?.find(c => c.id === s.category_id)?.name || s.category || '—'
          return (
            <div key={s.id} className="card grid md:grid-cols-8 gap-2 items-center">
              <div className="font-medium">{s.name}</div>
              <div>{catName}</div>
              <div>{s.duration_minutes}m</div>
              <div>{Number(s.price ?? 0).toFixed(0)}</div>
              <div className="text-sm text-gray-600 md:col-span-3">{s.description}</div>
              <div className="flex items-center gap-2 justify-end">
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
