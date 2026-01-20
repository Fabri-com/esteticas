import { createClient } from '@/lib/supabase/server'
import { normalizeArPhone } from '@/lib/phone'
import { addMinutes } from 'date-fns'

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()
  const { service_id, start_at, full_name, phone, email, notes } = body
  if (!service_id || !start_at || !full_name || !phone) {
    return new Response(JSON.stringify({ error: 'Faltan datos obligatorios' }), { status: 400 })
  }
  const normalized = normalizeArPhone(String(phone))
  const { data: service, error: sErr } = await supabase.from('services').select('id,duration_minutes,name').eq('id', service_id).single()
  if (sErr || !service) return new Response(JSON.stringify({ error: 'Servicio no encontrado' }), { status: 400 })

  // upsert customer by phone
  // Parse start/end and validate against now (AR timezone) and overlaps
  const start = new Date(start_at)
  const end = addMinutes(start, Number(service.duration_minutes) + 10) // buffer 10m default; configurable en admin luego
  const tz = 'America/Argentina/Buenos_Aires'
  const nowAr = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  if (start <= nowAr) {
    return new Response(JSON.stringify({ error: 'El horario ya pasó. Elegí un horario futuro.' }), { status: 400 })
  }

  // Insert via RPC with security definer to avoid RLS select on returning
  const expires = new Date(Date.now() + 10*60*1000)
  const { data: booked, error } = await supabase.rpc('book_appointment', {
    p_service_id: service.id,
    p_full_name: full_name,
    p_phone: normalized,
    p_email: email || null,
    p_start_at: start.toISOString(),
    p_end_at: end.toISOString(),
    p_notes: notes || null,
    p_expires_at: expires.toISOString(),
  })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  // Formatear fecha/hora en AR y 24hs
  const dateAr = start.toLocaleDateString('es-AR', { timeZone: tz })
  const timeAr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
  const id = Array.isArray(booked) ? booked[0]?.id : (booked as any)?.id
  const text = `Hola! Soy ${full_name}. Quiero reservar ${service.name} el ${dateAr} a las ${timeAr}.${notes ? ` Notas: ${notes}` : ''}`
  const bizPhone = (process.env.BUSINESS_WHATSAPP_PHONE || '').trim()
  const base = bizPhone ? `https://wa.me/${bizPhone}` : 'https://wa.me/'
  const link = `${base}?text=${encodeURIComponent(text)}`

  return new Response(JSON.stringify({ id, whatsapp_link: link }), { status: 200 })
}
