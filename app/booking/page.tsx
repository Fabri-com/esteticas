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

type Service = { id: string; name: string; duration_minutes: number; price: number }

export default function BookingPage(){
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ service_id: '', start_at: '', full_name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [date, setDate] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/services').then(r=>r.json()).then(setServices)
  }, [])

  // Preseleccionar servicio por query param ?service=<id>
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const svc = sp.get('service')
    if (svc) setForm(f => ({ ...f, service_id: f.service_id || svc }))
  }, [])

  useEffect(() => {
    const phone = form.phone.replace(/\D/g,'')
    if (phone.length >= 8) {
      fetch(`/api/customers?phone=${phone}`).then(r=>r.json()).then((c) => {
        if (c && !form.full_name) setForm(f=>({ ...f, full_name: c.full_name || f.full_name, email: c.email || f.email }))
      })
    }
  }, [form.phone])

  // Cargar slots cuando cambia servicio o fecha
  useEffect(() => {
    const loadSlots = async () => {
      setSlots([])
      if (!form.service_id || !date) return
      const supabase = createClient()
      // Obtener intervalo del servicio (default 60 si no disponible)
      const { data: svc } = await supabase.from('services').select('slot_interval_minutes').eq('id', form.service_id).maybeSingle()
      const interval = svc?.slot_interval_minutes || 60
      // Obtener ventanas del día seleccionado
      const d = new Date(date + 'T00:00:00')
      const weekday = d.getDay() // 0=Dom
      const { data: wins } = await supabase
        .from('service_time_windows')
        .select('start_time,end_time')
        .eq('service_id', form.service_id)
        .eq('weekday', weekday)
        .order('start_time')
      const now = new Date()
      const isToday = new Date().toDateString() === d.toDateString()
      const produced: string[] = []
      for (const w of wins || []) {
        // generar slots [start, end) cada 'interval' minutos
        const [sh, sm] = String(w.start_time).split(':').map(Number)
        const [eh, em] = String(w.end_time).split(':').map(Number)
        let cur = sh * 60 + sm
        const end = eh * 60 + em
        while (cur + interval <= end) {
          const hh = String(Math.floor(cur / 60)).padStart(2, '0')
          const mm = String(cur % 60).padStart(2, '0')
          const iso = `${date}T${hh}:${mm}`
          const dt = new Date(iso)
          if (!isToday || dt > now) produced.push(`${hh}:${mm}`)
          cur += interval
        }
      }
      setSlots(produced)
    }
    loadSlots()
  }, [form.service_id, date])

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
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Servicio</label>
          <select className="w-full border rounded px-3 py-2" value={form.service_id} onChange={e=>setForm({...form, service_id: e.target.value})}>
            <option value="">Seleccioná...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} • {s.duration_minutes}m</option>
            ))}
          </select>
          {errors.service_id && <p className="text-sm text-red-600">{errors.service_id}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
          {!!slots.length && (
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
          <div className="mt-3">
            <label className="block text-xs mb-1 text-gray-600">O elegir fecha y hora manualmente</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={form.start_at} onChange={e=>setForm({...form, start_at: e.target.value})} />
          </div>
          {errors.start_at && <p className="text-sm text-red-600">{errors.start_at}</p>}
        </div>
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
