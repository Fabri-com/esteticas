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
  let initialWindows: any[] = []
  if (searchParams?.edit) {
    const { data } = await supabase.from('services').select('*').eq('id', searchParams.edit).single()
    initialService = data || null
    if (initialService?.id) {
      const { data: win, error: winErr } = await supabase
        .from('service_time_windows')
        .select('id,weekday,start_time,end_time')
        .eq('service_id', initialService.id)
        .order('weekday')
        .order('start_time')
      if (!winErr) initialWindows = win || []
    }
  }

  async function createCategory(_: any, formData: FormData) {
    'use server'
    const supabase = createClient()
    const name = String(formData.get('new_category_name') || '').trim()
    if (!name) return { error: 'Ingresá un nombre' }
    const { error } = await supabase.from('service_categories').insert({ name })
    if (error) return { error: error.message }
    revalidatePath('/admin/services')
    return { success: true }
  }

  async function upsertService(_: any, formData: FormData) {
    'use server'
    const supabase = createClient()
    const idRaw = (formData.get('id') || '').toString().trim()
    const hasId = idRaw.length > 0
    const hhmm = String(formData.get('duration_hhmm') || '00:00')
    const [hStr = '0', mStr = '0'] = hhmm.split(':')
    const duration_minutes = (parseInt(hStr || '0', 10) || 0) * 60 + (parseInt(mStr || '0', 10) || 0)
    const base: any = {
      name: String(formData.get('name')),
      category: '',
      category_id: (formData.get('category_id') || '').toString().trim() || null,
      duration_minutes,
      price: parseFloat(String(formData.get('price') || '0')),
      slot_interval_minutes: parseInt(String(formData.get('slot_interval_minutes') || '60'), 10) || 60,
      description: String(formData.get('description') || ''),
      // image_url: set more below only if provided
      includes: (String(formData.get('includes') || '')
        .split(/\r?\n/) // split lines
        .map(s => s.trim())
        .filter(Boolean)) as unknown as string[],
      // gallery_urls: set below only if new files uploaded
      is_active: Boolean(formData.get('is_active')),
    }
    // Handle optional file upload to Supabase Storage
    const inputImageUrl = String(formData.get('image_url') || '').trim()
    if (inputImageUrl) {
      base.image_url = inputImageUrl
    }

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
      if (upErr) {
        return { error: `No se pudo subir la imagen principal: ${upErr.message}` }
      } else {
        const pub = bucket.getPublicUrl(path)
        base.image_url = pub.data.publicUrl
      }
    }

    // Optional multiple gallery files
    const gallery = formData.getAll('gallery_files') as File[]
    if (Array.isArray(gallery) && gallery.length) {
      const urls: string[] = []
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
        if (gErr) {
          return { error: `No se pudo subir una imagen de la galería: ${gErr.message}` }
        } else {
          const pub = bucket.getPublicUrl(path)
          urls.push(pub.data.publicUrl)
        }
      }
      if (urls.length) base.gallery_urls = urls
    }
    const payload = hasId ? { id: idRaw, ...base } : base
    const { data: saved, error } = await supabase.from('services').upsert(payload).select('id').single()
    if (error) {
      console.error('upsert service error', error.message)
      return { error: error.message }
    }
    const serviceId = saved?.id || idRaw

    // Time windows handling (prefer hidden JSON if present)
    let rows: { weekday: number, start_time: string, end_time: string }[] = []
    const twJson = String(formData.get('tw_json') || '').trim()
    if (twJson) {
      try {
        const parsed = JSON.parse(twJson)
        if (Array.isArray(parsed)) {
          rows = parsed
            .map((r: any) => ({ weekday: Number(r?.weekday), start_time: String(r?.start_time||''), end_time: String(r?.end_time||'') }))
            .filter(r => Number.isFinite(r.weekday) && r.start_time && r.end_time)
        }
      } catch {}
    }
    if (!rows.length) {
      const weekdays = formData.getAll('tw_weekday') as string[]
      const starts = formData.getAll('tw_start') as string[]
      const ends = formData.getAll('tw_end') as string[]
      for (let i = 0; i < Math.min(weekdays.length, starts.length, ends.length); i++) {
        const wd = parseInt(String(weekdays[i] || ''), 10)
        const st = String(starts[i] || '')
        const et = String(ends[i] || '')
        if (Number.isFinite(wd) && st && et) rows.push({ weekday: wd, start_time: st, end_time: et })
      }
    }
    if (rows.length) {
      const delRes = await supabase.from('service_time_windows').delete().eq('service_id', serviceId)
      // If table doesn't exist yet, skip schedule writes
      if (delRes.error && (delRes.error as any)?.code === '42P01') {
        // ignore relation does not exist
      } else {
        const insertRows = rows.map(r => ({ service_id: serviceId, ...r }))
        const { error: insErr } = await supabase.from('service_time_windows').insert(insertRows)
        if (insErr && (insErr as any)?.code !== '42P01') return { error: `No se pudieron guardar las franjas: ${insErr.message}` }
      }
    } else if (!hasId) {
      // Defaults on create if none provided
      const defaults = [
        { weekday: 1, start_time: '09:00', end_time: '13:00' },
        { weekday: 1, start_time: '16:00', end_time: '22:00' },
        { weekday: 2, start_time: '09:00', end_time: '13:00' },
        { weekday: 2, start_time: '16:00', end_time: '22:00' },
        { weekday: 3, start_time: '09:00', end_time: '13:00' },
        { weekday: 3, start_time: '16:00', end_time: '22:00' },
        { weekday: 4, start_time: '09:00', end_time: '13:00' },
        { weekday: 4, start_time: '16:00', end_time: '22:00' },
        { weekday: 5, start_time: '09:00', end_time: '13:00' },
        { weekday: 5, start_time: '16:00', end_time: '22:00' },
        { weekday: 6, start_time: '09:00', end_time: '13:00' },
      ]
      const { error: defErr } = await supabase.from('service_time_windows').insert(defaults.map(r => ({ service_id: serviceId, ...r })))
      if (defErr && (defErr as any)?.code !== '42P01') return { error: `No se pudieron guardar las franjas por defecto: ${defErr.message}` }
    } else {
      // Edición sin franjas: no permitir
      return { error: 'Agregá al menos una franja horaria antes de guardar.' }
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
      <ServiceForm categories={categories || []} action={upsertService} createCategory={createCategory} initial={initialService} windows={initialWindows} />

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
