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

  // Parse start/end and validate against now (AR timezone) and overlaps
  const start = new Date(start_at)
  const end = addMinutes(start, Number(service.duration_minutes) + 10) // buffer 10m default; configurable en admin luego
  const tz = 'America/Argentina/Buenos_Aires'
  const nowAr = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  if (start <= nowAr) {
    return new Response(JSON.stringify({ error: 'El horario ya pasó. Elegí un horario futuro.' }), { status: 400 })
  }

  // Prevent overlapping with existing appointments for this service (except cancelled/no_show)
  const { data: overlaps, error: ovErr } = await supabase
    .from('appointments')
    .select('id,status')
    .eq('service_id', service.id)
    .lt('start_at', end.toISOString())
    .gt('end_at', start.toISOString())
    .in('status', ['pending_whatsapp','confirmed','done'])
    .limit(1)
  if (ovErr) return new Response(JSON.stringify({ error: ovErr.message }), { status: 400 })
  if (overlaps && overlaps.length > 0) {
    return new Response(JSON.stringify({ error: 'Ese horario ya está reservado. Probá con otro horario.' }), { status: 409 })
  }

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
  // Formatear fecha/hora en AR y 24hs
  const dateAr = start.toLocaleDateString('es-AR', { timeZone: tz })
  const timeAr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
  const text = `Hola! Soy ${full_name}. Quiero reservar ${service.name} el ${dateAr} a las ${timeAr}. ID: ${appt.id}${notes ? `. Notas: ${notes}` : ''}`
  const link = `https://wa.me/${process.env.BUSINESS_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`

  return new Response(JSON.stringify({ id: appt.id, whatsapp_link: link }), { status: 200 })
}
