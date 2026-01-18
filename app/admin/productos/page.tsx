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

export default async function AdminProductosPage(){
  const supabase = await requireAdmin()
  const { data: products } = await supabase
    .from('products')
    .select('id,name,price,product_categories(name),image_url')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn">Volver al Dashboard</Link>
        </div>
      </div>
      <div className="space-y-3">
        {(products||[]).map((p: any) => (
          <div key={p.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />}
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">{Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name} · {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(p.price ?? 0))}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border px-3 py-1.5 text-sm" disabled>Editar</button>
              <button className="btn bg-gray-900 hover:bg-black" disabled>Eliminar</button>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && (
          <div className="text-sm text-gray-600">No hay productos cargados.</div>
        )}
      </div>
    </div>
  )
}
