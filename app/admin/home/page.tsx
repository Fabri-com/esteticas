import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import HomePhotoUploader from '@/components/admin/HomePhotoUploader'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminHomePage() {
  const supabase = await requireAdmin()
  const { data: photos } = await supabase
    .from('home_photos')
    .select('id,kind,title,alt,public_url,sort_order,is_active,created_at')
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  async function toggleActive(formData: FormData) {
    'use server'
    const supabase = await requireAdmin()
    const id = String(formData.get('id'))
    const is_active = String(formData.get('is_active')) === 'true'
    await supabase.from('home_photos').update({ is_active: !is_active }).eq('id', id)
    revalidatePath('/admin/home')
  }

  async function removePhoto(formData: FormData) {
    'use server'
    const supabase = await requireAdmin()
    const id = String(formData.get('id'))
    await supabase.from('home_photos').delete().eq('id', id)
    revalidatePath('/admin/home')
  }

  async function move(formData: FormData) {
    'use server'
    const supabase = await requireAdmin()
    const id = String(formData.get('id'))
    const dir = String(formData.get('dir')) // up|down
    const sort = Number(formData.get('sort_order'))
    const kind = String(formData.get('kind'))
    const newSort = dir === 'up' ? sort - 1 : sort + 1
    await supabase.from('home_photos').update({ sort_order: newSort }).eq('id', id)
    revalidatePath('/admin/home')
  }

  const byKind = (k: 'hero'|'gallery') => (photos||[]).filter(p=>p.kind===k)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn">Volver a Agenda</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Subir imagen</h2>
          <HomePhotoUploader defaultKind="hero" />
          <p className="text-xs text-gray-500">Bucket: <span className="font-mono">home</span>. Acepta imágenes; las URLs serán públicas.</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Hero (una principal)</h2>
          <div className="space-y-2">
            {byKind('hero').map(p => (
              <div key={p.id} className="border rounded-lg p-2 flex items-center gap-3">
                <img src={p.public_url} alt={p.alt||''} className="w-32 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.title||'(sin título)'} {p.is_active ? <span className="text-green-600 text-xs">• Activa</span> : <span className="text-gray-500 text-xs">• Inactiva</span>}</div>
                  <div className="text-xs text-gray-500">orden: {p.sort_order}</div>
                </div>
                <form action={move}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="sort_order" value={p.sort_order} />
                  <input type="hidden" name="kind" value={p.kind} />
                  <button name="dir" value="up" className="px-2 py-1 border rounded text-xs">▲</button>
                </form>
                <form action={move}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="sort_order" value={p.sort_order} />
                  <input type="hidden" name="kind" value={p.kind} />
                  <button name="dir" value="down" className="px-2 py-1 border rounded text-xs">▼</button>
                </form>
                <form action={toggleActive}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="is_active" value={String(p.is_active)} />
                  <button className="px-2 py-1 border rounded text-xs">{p.is_active ? 'Desactivar' : 'Activar'}</button>
                </form>
                <form action={removePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="px-2 py-1 border rounded text-xs text-red-600">Eliminar</button>
                </form>
              </div>
            ))}
            {!byKind('hero').length && <div className="text-sm text-gray-500">Aún no hay imágenes hero.</div>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Galería</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {byKind('gallery').map(p => (
            <div key={p.id} className="border rounded-lg p-2 space-y-2">
              <img src={p.public_url} alt={p.alt||''} className="w-full aspect-video object-cover rounded" />
              <div className="flex items-center justify-between text-sm">
                <div className="truncate max-w-[60%]">{p.title||'(sin título)'} {p.is_active ? <span className="text-green-600 text-xs">• Activa</span> : <span className="text-gray-500 text-xs">• Inactiva</span>}</div>
                <div className="text-xs text-gray-500">{p.sort_order}</div>
              </div>
              <div className="flex gap-2">
                <form action={move}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="sort_order" value={p.sort_order} />
                  <input type="hidden" name="kind" value={p.kind} />
                  <button name="dir" value="up" className="px-2 py-1 border rounded text-xs">▲</button>
                </form>
                <form action={move}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="sort_order" value={p.sort_order} />
                  <input type="hidden" name="kind" value={p.kind} />
                  <button name="dir" value="down" className="px-2 py-1 border rounded text-xs">▼</button>
                </form>
                <form action={toggleActive}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="is_active" value={String(p.is_active)} />
                  <button className="px-2 py-1 border rounded text-xs">{p.is_active ? 'Desactivar' : 'Activar'}</button>
                </form>
                <form action={removePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="px-2 py-1 border rounded text-xs text-red-600">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
        {!byKind('gallery').length && <div className="text-sm text-gray-500">Aún no hay imágenes en la galería.</div>}
      </div>
    </div>
  )
}
