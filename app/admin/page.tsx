import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminDashboard() {
  const supabase = await requireAdmin()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(start); end.setDate(end.getDate() + 1)
  const { data: appts } = await supabase.from('appointments').select('id,start_at,end_at,status,notes, customers(full_name,phone), services(name)').gte('start_at', start.toISOString()).lt('start_at', end.toISOString()).order('start_at')

  async function updateStatus(formData: FormData) {
    'use server'
    const id = String(formData.get('id'))
    const status = String(formData.get('status'))
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
  }

  async function cleanupPending() {
    'use server'
    const supabase = createClient()
    await supabase.rpc('cleanup_expired_pending')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda de hoy</h1>
        <div className="flex gap-2">
          <Link href="/admin/services" className="btn">Servicios</Link>
          <form action={cleanupPending}><button className="btn bg-gray-900 hover:bg-black">Limpiar pendientes</button></form>
        </div>
      </div>
      <div className="space-y-3">
        {appts?.map(a => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{new Date(a.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(a.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              {(() => {
                const serviceName = Array.isArray(a.services) ? a.services[0]?.name : (a.services as any)?.name
                const customerName = Array.isArray(a.customers) ? a.customers[0]?.full_name : (a.customers as any)?.full_name
                return (
                  <div className="font-medium">{serviceName} • {customerName}</div>
                )
              })()}
              <div className="text-sm text-gray-600">{a.status}</div>
            </div>
            <form action={updateStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={a.id} />
              <select name="status" className="border rounded px-2 py-1">
                {['pending_whatsapp','confirmed','done','cancelled','no_show'].map(s => <option key={s} value={s} selected={s===a.status}>{s}</option>)}
              </select>
              <button className="btn py-1">Actualizar</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
