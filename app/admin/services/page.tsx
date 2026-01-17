import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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
      is_active: Boolean(formData.get('is_active')),
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
      <form action={upsertService} className="card grid md:grid-cols-7 gap-2 items-end">
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
        <input name="image_url" placeholder="URL imagen (opcional)" className="border rounded px-2 py-1" />
        <input name="description" placeholder="Descripción" className="border rounded px-2 py-1 md:col-span-2" />
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
