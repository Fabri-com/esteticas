import { createClient } from '@/lib/supabase/server'
import { normalizeArPhone } from '@/lib/phone'
import { addMinutes } from 'date-fns'

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()
  const { service_id, start_at, full_name, phone, email, notes } = body
  if (!service_id || !start_at || !full_name || !phone) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }
  const normalized = normalizeArPhone(String(phone))
  const { data: service, error: sErr } = await supabase.from('services').select('id,duration_minutes,name').eq('id', service_id).single()
  if (sErr || !service) return new Response(JSON.stringify({ error: 'Service not found' }), { status: 400 })

  // upsert customer by phone
  const { data: customer } = await supabase.from('customers').upsert({ phone: normalized, full_name, email: email || null }, { onConflict: 'phone' }).select('id,full_name,phone,email').single()

  const start = new Date(start_at)
  const end = addMinutes(start, Number(service.duration_minutes) + 10) // buffer 10m default; configurable en admin luego

  const { data: appt, error } = await supabase.from('appointments').insert({
    customer_id: customer?.id,
    service_id: service.id,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status: 'pending_whatsapp',
    notes: notes || null,
    expires_at: new Date(Date.now() + 10*60*1000).toISOString(),
  }).select('id').single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

  const text = `Hola! Soy ${full_name}. Quiero reservar ${service.name} el ${start.toLocaleDateString()} a las ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ID: ${appt.id}${notes ? `. Notas: ${notes}` : ''}`
  const link = `https://wa.me/${process.env.BUSINESS_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`

  return new Response(JSON.stringify({ id: appt.id, whatsapp_link: link }), { status: 200 })
}
