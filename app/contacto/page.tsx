'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ContactoPage(){
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string>('')
  const [err, setErr] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOk(''); setErr(''); setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('contact_messages').insert({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        subject: form.subject || null,
        message: form.message,
      })
      if (error) throw error
      setOk('¡Gracias! Recibimos tu mensaje y te contactaremos a la brevedad.')
      setForm({ full_name: '', email: '', phone: '', subject: '', message: '' })
    } catch (e: any) {
      setErr('Ocurrió un error al enviar el mensaje. Intentalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Contactanos</h1>
        <p className="text-gray-500">Estamos aquí para responder tus preguntas. Envíanos un mensaje y te contactaremos a la brevedad.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-pink-50/60 p-4 text-sm">
          <div className="font-medium">Teléfono</div>
          <div className="text-gray-600">+54 11 1234-5678</div>
          <div className="text-gray-400">Lunes a Viernes 9 a 20hs</div>
        </div>
        <div className="rounded-xl border bg-pink-50/60 p-4 text-sm">
          <div className="font-medium">Email</div>
          <div className="text-gray-600">info@tuestetica.com</div>
          <div className="text-gray-400">Respondemos en 24hs</div>
        </div>
        <div className="rounded-xl border bg-pink-50/60 p-4 text-sm">
          <div className="font-medium">Dirección</div>
          <div className="text-gray-600">Av. Santa Fe 1234, CABA</div>
          <div className="text-gray-400">Buenos Aires, Argentina</div>
        </div>
        <div className="rounded-xl border bg-pink-50/60 p-4 text-sm">
          <div className="font-medium">Horarios</div>
          <div className="text-gray-600">Lun a Vie: 9:00 - 20:00</div>
          <div className="text-gray-400">Sáb: 9:00 - 18:00</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-4 space-y-3">
          <div className="text-pink-700 font-medium">Envíanos un mensaje</div>
          {ok && <div className="text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">{ok}</div>}
          {err && <div className="text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">{err}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Nombre completo*</label>
              <input className="w-full border rounded px-3 py-2" value={form.full_name} onChange={e=>setForm({...form, full_name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Asunto</label>
              <input className="w-full border rounded px-3 py-2" value={form.subject} onChange={e=>setForm({...form, subject: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Mensaje*</label>
            <textarea className="w-full border rounded px-3 py-2" rows={5} value={form.message} onChange={e=>setForm({...form, message: e.target.value})} required />
          </div>
          <button className="px-4 py-2 rounded bg-pink-500 text-white" disabled={loading}>{loading ? 'Enviando...' : 'Enviar mensaje'}</button>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border">
            <iframe
              title="Mapa"
              src="https://www.google.com/maps?q=Av.+Santa+Fe+1234,+CABA&output=embed"
              className="w-full h-[320px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="rounded-xl border bg-white p-4 text-sm">
            <div className="font-medium mb-1">Nuestra ubicación</div>
            <div>Av. Santa Fe 1234, C1059 CABA</div>
            <div>Buenos Aires, Argentina</div>
          </div>
          <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
            <div className="font-medium">Seguinos en redes</div>
            <a className="block border rounded px-3 py-2" href="#" target="_blank" rel="noreferrer">Instagram</a>
            <a className="block border rounded px-3 py-2" href="#" target="_blank" rel="noreferrer">Facebook</a>
            <a className="block border rounded px-3 py-2" href="https://wa.me/+5491112345678" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
          <div className="rounded-xl border bg-white p-4 text-sm">
            <div className="font-medium mb-1">Horarios de atención</div>
            <div>Lunes a Viernes: 9:00 - 20:00</div>
            <div>Sábados: 9:00 - 18:00</div>
          </div>
        </div>
      </div>
    </div>
  )
}
