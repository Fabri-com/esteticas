import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminServicesPage(){
  const supabase = await requireAdmin()
  const { data: services } = await supabase.from('services').select('*').order('category')

  async function upsertService(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('id')||'') || undefined
    const payload = {
      id,
      name: String(formData.get('name')),
      category: String(formData.get('category')),
      duration_minutes: Number(formData.get('duration_minutes')),
      price: Number(formData.get('price')),
      description: String(formData.get('description')),
      is_active: Boolean(formData.get('is_active')),
    }
    await supabase.from('services').upsert(payload)
  }

  async function deleteService(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('id'))
    await supabase.from('services').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Servicios</h1>
      <form action={upsertService} className="card grid md:grid-cols-6 gap-2 items-end">
        <input name="name" placeholder="Nombre" className="border rounded px-2 py-1" required />
        <input name="category" placeholder="Categoría" className="border rounded px-2 py-1" required />
        <input name="duration_minutes" type="number" placeholder="Duración" className="border rounded px-2 py-1" required />
        <input name="price" type="number" placeholder="Precio" className="border rounded px-2 py-1" required />
        <input name="description" placeholder="Descripción" className="border rounded px-2 py-1 md:col-span-2" />
        <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Activo</label>
        <button className="btn md:col-start-6">Guardar</button>
      </form>

      <div className="space-y-3">
        {services?.map(s => (
          <div key={s.id} className="card grid md:grid-cols-7 gap-2 items-center">
            <div className="font-medium">{s.name}</div>
            <div>{s.category}</div>
            <div>{s.duration_minutes}m</div>
            <div>${'{'}Number(s.price).toFixed(0){'}'}</div>
            <div className="text-sm text-gray-600 md:col-span-2">{s.description}</div>
            <div className="flex items-center gap-2 justify-end">
              <form action={deleteService}>
                <input type="hidden" name="id" value={s.id} />
                <button className="btn bg-gray-900 hover:bg-black">Eliminar</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
