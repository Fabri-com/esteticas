import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { normalizeArPhone } from '@/lib/phone'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminDashboard({ searchParams }: { searchParams?: { date?: string; status?: string; q?: string } }) {
  const supabase = await requireAdmin()
  const tz = 'America/Argentina/Buenos_Aires'
  const todayArISO = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  const selectedDateISO = (searchParams?.date && /\d{4}-\d{2}-\d{2}/.test(searchParams.date)) ? searchParams!.date! : todayArISO
  const tomorrowISO = (() => { const dd = new Date(`${todayArISO}T00:00:00-03:00`); dd.setDate(dd.getDate()+1); return dd.toLocaleDateString('en-CA', { timeZone: tz }) })()
  const start = new Date(`${selectedDateISO}T00:00:00-03:00`)
  const end = new Date(start); end.setDate(end.getDate() + 1)
  const { data: appts } = await supabase
    .from('appointments')
    .select('id,start_at,end_at,status,notes, customers(full_name,phone), services(name,price,category)')
    .gte('start_at', start.toISOString())
    .lt('start_at', end.toISOString())
    .order('start_at')

  async function updateStatus(formData: FormData) {
    'use server'
    const id = String(formData.get('id'))
    const status = String(formData.get('status'))
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    revalidatePath('/admin')
  }

  async function cleanupPending() {
    'use server'
    const supabase = createClient()
    await supabase.rpc('cleanup_expired_pending')
    revalidatePath('/admin')
  }

  const statusFilter = (searchParams?.status || '').trim()
  const q = (searchParams?.q || '').trim().toLowerCase()
  const filtered = (appts || []).filter(a => {
    const matchStatus = !statusFilter || a.status === statusFilter
    const cust = Array.isArray(a.customers) ? a.customers[0] : (a.customers as any)
    const svc = Array.isArray(a.services) ? a.services[0] : (a.services as any)
    const catName = svc?.category
    const phone = String(cust?.phone || '')
    const full = String(cust?.full_name || '')
    const text = `${full} ${phone} ${svc?.name || ''} ${catName || ''}`.toLowerCase()
    const matchQ = !q || text.includes(q)
    return matchStatus && matchQ
  })

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
  const fmtPrice = (n?: number|null) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n || 0))
  const labelStatus = (s: string) => ({
    pending_whatsapp: 'Pendiente WhatsApp',
    confirmed: 'Confirmado',
    done: 'Finalizado',
    cancelled: 'Cancelado',
    no_show: 'Ausente',
  } as Record<string,string>)[s] || s
  const confirmedList = filtered.filter(x=>x.status==='confirmed')
  const confirmedRevenue = confirmedList.reduce((acc, a) => {
    const svc = Array.isArray(a.services) ? (a.services as any[])[0] : (a.services as any)
    return acc + Number(svc?.price || 0)
  }, 0)
  const pendingList = filtered.filter(x=>x.status==='pending_whatsapp')
  const pendingRevenue = pendingList.reduce((acc, a) => {
    const svc = Array.isArray(a.services) ? (a.services as any[])[0] : (a.services as any)
    return acc + Number(svc?.price || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <div className="flex gap-2">
          <Link href="/admin/services" className="btn">Servicios</Link>
          <Link href="/admin/productos" className="btn">Productos</Link>
          <Link href="/admin/academy" className="btn">Academia</Link>
          <form action={cleanupPending}><button className="btn bg-gray-900 hover:bg-black">Limpiar pendientes</button></form>
          <Link href={`/admin?date=${selectedDateISO}&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(q)}`} className="btn">Actualizar</Link>
          <Link href={`/admin/export?date=${selectedDateISO}&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(q)}`} className="btn">Exportar CSV</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="flex gap-2" method="get">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="q" value={q} />
          <button className={`px-3 py-1 rounded-full border text-sm ${selectedDateISO===todayArISO ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-pink-50'}`} name="date" value={todayArISO}>Hoy</button>
          <button className={`px-3 py-1 rounded-full border text-sm ${tomorrowISO===selectedDateISO ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-pink-50'}`} name="date" value={tomorrowISO}>Mañana</button>
          <input type="date" className="border rounded px-3 py-1 text-sm" name="date" defaultValue={selectedDateISO} />
          <button className="px-3 py-1 rounded border text-sm">Ir</button>
        </form>
        <div className="grow" />
        <form className="flex items-center gap-2" method="get">
          <input type="hidden" name="date" value={selectedDateISO} />
          <input type="hidden" name="status" value={statusFilter} />
          <input name="q" placeholder="Buscar nombre o teléfono" defaultValue={q} className="border rounded px-3 py-1 text-sm w-64" />
          <button className="px-3 py-1 rounded border text-sm">Buscar</button>
        </form>
      </div>

      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-2 border-b">
        {[
          { value: '', label: 'Todos' },
          { value: 'pending_whatsapp', label: labelStatus('pending_whatsapp') },
          { value: 'confirmed', label: labelStatus('confirmed') },
          { value: 'done', label: labelStatus('done') },
          { value: 'cancelled', label: labelStatus('cancelled') },
          { value: 'no_show', label: labelStatus('no_show') },
        ].map(t => (
          <Link key={t.value||'all'} href={`/admin?date=${selectedDateISO}&status=${encodeURIComponent(t.value)}&q=${encodeURIComponent(q)}`} className={`px-3 py-2 text-sm border-b-2 ${statusFilter===t.value ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>{t.label}</Link>
        ))}
      </div>

      {/* KPIs del día */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(() => { const list = filtered; return [
          { label: 'Total', val: list.length },
          { label: 'Pendientes', val: list.filter(x=>x.status==='pending_whatsapp').length },
          { label: 'Confirmados', val: list.filter(x=>x.status==='confirmed').length },
          { label: 'Finalizados', val: list.filter(x=>x.status==='done').length },
          { label: 'Ingresos confirmados', val: fmtPrice(confirmedRevenue) },
        ].map(k => (
          <div key={k.label} className="rounded-lg border bg-white p-3"><div className="text-xs text-gray-500">{k.label}</div><div className="text-xl font-semibold">{k.val}</div></div>
        )) })()}
      </div>

      {/* Resumen ejecutivo de la fecha seleccionada */}
      <div className="rounded-lg border bg-white p-3 text-sm text-gray-800">
        {selectedDateISO===todayArISO ? (
          <div>
            Hoy cerramos con <span className="font-semibold">{confirmedList.length}</span> reservas confirmadas{confirmedRevenue>0 ? (<>
              {' '}({fmtPrice(confirmedRevenue)} estimados)
            </>) : null}. Pendientes: <span className="font-semibold">{filtered.filter(x=>x.status==='pending_whatsapp').length}</span>. Finalizados: <span className="font-semibold">{filtered.filter(x=>x.status==='done').length}</span>.
          </div>
        ) : (
          <div>
            Para el <span className="font-semibold">{new Date(selectedDateISO+"T00:00:00-03:00").toLocaleDateString('es-AR',{ timeZone: tz })}</span> hay <span className="font-semibold">{confirmedList.length}</span> reservas confirmadas{confirmedRevenue>0 ? (<>
              {' '}({fmtPrice(confirmedRevenue)} estimados)
            </>) : null} y <span className="font-semibold">{filtered.filter(x=>x.status==='pending_whatsapp').length}</span> pendientes para contactar.
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map(a => {
          const svc = Array.isArray(a.services) ? (a.services as any[])[0] : (a.services as any)
          const cust = Array.isArray(a.customers) ? (a.customers as any[])[0] : (a.customers as any)
          const catName = svc?.category
          const phoneDigits = String(cust?.phone||'').replace(/\D/g,'')
          const to = `https://wa.me/54${phoneDigits}`
          const dateAr = new Date(a.start_at).toLocaleDateString('es-AR', { timeZone: tz })
          const timeAr = fmtTime(a.start_at)
          const msg = encodeURIComponent(`Hola ${cust?.full_name||''}! Te recordamos tu turno de ${svc?.name||''} (${catName||''}) para el ${dateAr} a las ${timeAr}.`)
          const waLink = `${to}?text=${msg}`
          return (
            <div key={a.id} className="rounded-xl border bg-white p-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm text-gray-500">{fmtTime(a.start_at)} - {fmtTime(a.end_at)}</div>
                <div className="font-medium">
                  {svc?.name} {catName ? <span className="text-xs text-gray-500">• {catName}</span> : null}
                </div>
                <div className="text-sm text-gray-700">{cust?.full_name || '-'} • {cust?.phone || ''}</div>
                <div className="text-sm text-pink-700">{fmtPrice(svc?.price)}</div>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                  a.status==='confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                  a.status==='pending_whatsapp' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  a.status==='done' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  a.status==='cancelled' ? 'bg-gray-100 text-gray-700 border' :
                  a.status==='no_show' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-600 border'
                }`}>{labelStatus(a.status)}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={waLink} target="_blank" className="px-2 py-1 rounded border text-sm">WhatsApp</a>
                <form action={updateStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="status" className="border rounded px-2 py-1 text-sm">
                    {['pending_whatsapp','confirmed','done','cancelled','no_show'].map(s => <option key={s} value={s} selected={s===a.status}>{labelStatus(s)}</option>)}
                  </select>
                  <button className="btn py-1">Actualizar</button>
                </form>
              </div>
            </div>
          )
        })}
        {!filtered.length && (
          <div className="text-sm text-gray-500">No hay turnos para la fecha/filtrado seleccionado.</div>
        )}
      </div>
    </div>
  )
}
