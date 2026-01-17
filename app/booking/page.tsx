'use client'
import { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    fetch('/api/services').then(r=>r.json()).then(setServices)
  }, [])

  useEffect(() => {
    const phone = form.phone.replace(/\D/g,'')
    if (phone.length >= 8) {
      fetch(`/api/customers?phone=${phone}`).then(r=>r.json()).then((c) => {
        if (c && !form.full_name) setForm(f=>({ ...f, full_name: c.full_name || f.full_name, email: c.email || f.email }))
      })
    }
  }, [form.phone])

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
          <label className="block text-sm mb-1">Fecha y hora</label>
          <input type="datetime-local" className="w-full border rounded px-3 py-2" value={form.start_at} onChange={e=>setForm({...form, start_at: e.target.value})} />
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
