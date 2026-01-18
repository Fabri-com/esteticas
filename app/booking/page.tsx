'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { normalizeArPhone } from '@/lib/phone'

const schema = z.object({
  service_id: z.string().uuid({ message: 'Seleccioná un servicio' }),
  start_at: z.string().min(1, 'Elegí fecha y hora'),
  full_name: z.string().min(3, 'Ingresá tu nombre'),
  phone: z.string().min(8, 'Ingresá tu teléfono'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

type Service = { id: string; name: string; duration_minutes: number; price: number; category_id?: string; category_name?: string }
type Category = { id: string; name: string }

export default function BookingPage(){
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ service_id: '', start_at: '', full_name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [date, setDate] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [slotsToday, setSlotsToday] = useState<string[]>([])
  const [slotsTomorrow, setSlotsTomorrow] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // Traer servicios con nombre de categoría
      const { data } = await supabase
        .from('services')
        .select('id,name,duration_minutes,price,category_id, service_categories(name)')
        .order('name')
      const mapped: Service[] = (data||[]).map((s: any) => ({
        id: s.id,
        name: s.name,
        duration_minutes: s.duration_minutes,
        price: s.price,
        category_id: s.category_id,
        category_name: s.service_categories?.name || undefined,
      }))
      setServices(mapped)
      const { data: cats } = await supabase.from('service_categories').select('id,name').order('name')
      setCategories(cats || [])
    }
    load()
  }, [])

  const formatPrice = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

  // Preseleccionar servicio por query param ?service=<id>
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const svc = sp.get('service')
    if (svc) setForm(f => ({ ...f, service_id: f.service_id || svc }))
  }, [])

  // Si hay servicio seleccionado, sincronizar categoría
  useEffect(() => {
    if (!form.service_id) return
    const s = services.find(x => x.id === form.service_id)
    if (s?.category_id) setCategoryId(prev => prev || s.category_id!)
  }, [form.service_id, services])

  useEffect(() => {
    const phone = form.phone.replace(/\D/g,'')
    if (phone.length >= 8) {
      fetch(`/api/customers?phone=${phone}`).then(r=>r.json()).then((c) => {
        if (c && !form.full_name) setForm(f=>({ ...f, full_name: c.full_name || f.full_name, email: c.email || f.email }))
      })
    }
  }, [form.phone])

  // Helper para generar slots de una fecha dada
  const buildSlotsFor = async (svcId: string, dateISO: string): Promise<string[]> => {
    const supabase = createClient()
    const { data: svc } = await supabase.from('services').select('slot_interval_minutes').eq('id', svcId).maybeSingle()
    const interval = svc?.slot_interval_minutes || 60
    const d = new Date(dateISO + 'T00:00:00')
    const weekday = d.getDay()
    const { data: wins } = await supabase
      .from('service_time_windows')
      .select('start_time,end_time')
      .eq('service_id', svcId)
      .eq('weekday', weekday)
      .order('start_time')
    const now = new Date()
    const isToday = new Date().toDateString() === d.toDateString()
    const produced: string[] = []
    for (const w of wins || []) {
      const [sh, sm] = String(w.start_time).split(':').map(Number)
      const [eh, em] = String(w.end_time).split(':').map(Number)
      let cur = sh * 60 + sm
      const end = eh * 60 + em
      while (cur + interval <= end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, '0')
        const mm = String(cur % 60).padStart(2, '0')
        const iso = `${dateISO}T${hh}:${mm}`
        const dt = new Date(iso)
        if (!isToday || dt > now) produced.push(`${hh}:${mm}`)
        cur += interval
      }
    }
    return produced
  }

  // Cargar slots cuando cambia servicio o fecha
  useEffect(() => {
    const loadSlots = async () => {
      setSlotsLoading(true)
      setSlots([])
      if (!form.service_id || !date) return
      const produced = await buildSlotsFor(form.service_id, date)
      setSlots(produced)
      setSlotsLoading(false)
    }
    loadSlots()
  }, [form.service_id, date])

  // Previsualización de Hoy y Mañana
  useEffect(() => {
    const run = async () => {
      setSlotsToday([]); setSlotsTomorrow([])
      if (!form.service_id) return
      const today = new Date(); const d1 = today.toISOString().slice(0,10)
      const tmw = new Date(); tmw.setDate(today.getDate()+1); const d2 = tmw.toISOString().slice(0,10)
      const [s1, s2] = await Promise.all([buildSlotsFor(form.service_id, d1), buildSlotsFor(form.service_id, d2)])
      setSlotsToday(s1); setSlotsTomorrow(s2)
    }
    run()
  }, [form.service_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(form)
    if (!parsed.success) {
      const map: Record<string,string> = {}
      parsed.error.issues.forEach(i => map[i.path[0] as string] = i.message)
      setErrors(map)
      return
    }
    setLoading(true)
    const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (data.whatsapp_link) {
      window.location.href = data.whatsapp_link
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reservar</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Categoría</label>
          <select className="w-full border rounded px-3 py-2 mb-2" value={categoryId} onChange={e=>{ setCategoryId(e.target.value); setForm(f=>({ ...f, service_id: '' })) }}>
            <option value="">Seleccioná categoría…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label className="block text-sm mb-1">Servicio</label>
          <select className="w-full border rounded px-3 py-2" value={form.service_id} onChange={e=>setForm({...form, service_id: e.target.value})} disabled={!categoryId}>
            <option value="">{categoryId ? 'Seleccioná...' : 'Elegí primero una categoría'}</option>
            {services.filter(s => !categoryId || s.category_id === categoryId).map(s => (
              <option key={s.id} value={s.id}>{s.name} • {s.duration_minutes}m{ s.category_name ? ` • ${s.category_name}`: '' } • {formatPrice(s.price)}</option>
            ))}
          </select>
          {errors.service_id && <p className="text-sm text-red-600">{errors.service_id}</p>}
          {!!form.service_id && (
            <div className="mt-2 rounded border border-pink-200 bg-pink-50 text-pink-800 px-3 py-2 text-sm">
              {(() => { const s = services.find(x=>x.id===form.service_id); if (!s) return null; return (
                <>
                  {s.name} · {s.duration_minutes} minutos{ s.category_name ? ` · ${s.category_name}`: '' } · {formatPrice(s.price)}
                </>
              )})()}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <div className="flex gap-2">
            <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="px-3 py-2 border rounded text-sm" onClick={() => {
                if (!date) return
                const d = new Date(date)
                d.setDate(d.getDate() - 1)
                const iso = d.toISOString().slice(0,10)
                setDate(iso)
              }}>◀</button>
              <button type="button" className="px-3 py-2 border rounded text-sm" onClick={() => {
                const base = date ? new Date(date) : new Date()
                const d = new Date(base)
                d.setDate(d.getDate() + 1)
                const iso = d.toISOString().slice(0,10)
                setDate(iso)
              }}>▶</button>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" className="px-3 py-1 border rounded-full text-sm" onClick={() => setDate(new Date().toISOString().slice(0,10))}>Hoy</button>
            <button type="button" className="px-3 py-1 border rounded-full text-sm" onClick={() => { const t=new Date(); t.setDate(t.getDate()+1); setDate(t.toISOString().slice(0,10)) }}>Mañana</button>
          </div>
          {slotsLoading && (
            <div className="mt-3 text-sm text-gray-500">Buscando horarios…</div>
          )}
          {!!slots.length && !slotsLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`px-3 py-1 rounded-full text-sm border ${form.start_at.endsWith('T'+t) ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`}
                  onClick={() => setForm(f => ({ ...f, start_at: `${date}T${t}` }))}
                >{t}</button>
              ))}
            </div>
          )}
          {!slotsLoading && form.service_id && date && slots.length===0 && (
            <div className="mt-3 text-sm text-gray-500">No hay horarios disponibles para esta fecha.</div>
          )}
          <div className="mt-3">
            <label className="block text-xs mb-1 text-gray-600">O elegir fecha y hora manualmente</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={form.start_at} onChange={e=>setForm({...form, start_at: e.target.value})} />
          </div>
          {errors.start_at && <p className="text-sm text-red-600">{errors.start_at}</p>}
        </div>
        {!!form.service_id && (
          <div>
            <label className="block text-sm mb-1">Hoy y Mañana</label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Hoy</div>
                <div className="flex flex-wrap gap-2">
                  {slotsToday.map(t => (
                    <button key={t} type="button" className={`px-3 py-1 rounded-full border ${date && form.start_at.endsWith('T'+t) ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`} onClick={()=>{ const d=new Date().toISOString().slice(0,10); setDate(d); setForm(f=>({...f,start_at:`${d}T${t}`})) }}>{t}</button>
                  ))}
                  {slotsToday.length===0 && <div className="text-gray-400">Sin turnos</div>}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Mañana</div>
                <div className="flex flex-wrap gap-2">
                  {slotsTomorrow.map(t => (
                    <button key={t} type="button" className={`px-3 py-1 rounded-full border ${date && form.start_at.endsWith('T'+t) ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`} onClick={()=>{ const tm=new Date(); tm.setDate(tm.getDate()+1); const d=tm.toISOString().slice(0,10); setDate(d); setForm(f=>({...f,start_at:`${d}T${t}`})) }}>{t}</button>
                  ))}
                  {slotsTomorrow.length===0 && <div className="text-gray-400">Sin turnos</div>}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Nombre y Apellido</label>
            <input className="w-full border rounded px-3 py-2" value={form.full_name} onChange={e=>setForm({...form, full_name: e.target.value})} />
            {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono (WhatsApp)</label>
            <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Email (opcional)</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Notas (opcional)</label>
          <textarea className="w-full border rounded px-3 py-2" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Creando...' : 'Confirmar y abrir WhatsApp'}</button>
      </form>
    </div>
  )
}
