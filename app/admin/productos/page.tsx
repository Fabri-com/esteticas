import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import ProductForm from './product-form'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) redirect('/admin/login')
  return supabase
}

export default async function AdminProductosPage({ searchParams }: { searchParams?: { edit?: string } }){
  const supabase = await requireAdmin()
  const { data: products } = await supabase
    .from('products')
    .select('id,name,price,product_categories(name),image_url,category_id')
    .order('name')
  const { data: categories } = await supabase.from('product_categories').select('id,name').order('name')

  let initial: any = null
  let variants: any[] = []
  if (searchParams?.edit) {
    const { data } = await supabase.from('products').select('*').eq('id', searchParams.edit).single()
    initial = data || null
    if (initial?.id) {
      const { data: v } = await supabase.from('product_variants').select('id,name,color_hex,image_url,sort_order,is_active').eq('product_id', initial.id).order('sort_order').order('created_at')
      variants = v || []
    }
  }

  async function createCategory(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const name = String(fd.get('new_category_name') || '').trim()
    if (!name) return { error: 'Ingresá un nombre' }
    const { error } = await supabase.from('product_categories').insert({ name })
    if (error) return { error: error.message }
    revalidatePath('/admin/productos')
    return { success: true }
  }

  async function upsertProduct(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const idRaw = String(fd.get('id') || '')
    const base: any = {
      name: String(fd.get('name') || ''),
      category_id: (fd.get('category_id') || '').toString().trim() || null,
      price: parseFloat(String(fd.get('price') || '0')),
      description: String(fd.get('description') || ''),
    }
    const file = fd.get('image_file') as File | null
    if (file && typeof file === 'object' && 'arrayBuffer' in file && (file as File).size > 0) {
      const ab = await (file as File).arrayBuffer()
      const ext = (file as File).type?.split('/')?.[1] || 'jpg'
      const path = `${randomUUID()}.${ext}`
      const bucket = supabase.storage.from('product-images')
      const { error: upErr } = await bucket.upload(path, Buffer.from(ab), { contentType: (file as File).type || 'image/jpeg', upsert: true })
      if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` }
      const pub = bucket.getPublicUrl(path)
      base.image_url = pub.data.publicUrl
    }
    const payload = idRaw ? { id: idRaw, ...base } : base
    const { error } = await supabase.from('products').upsert(payload)
    if (error) return { error: error.message }
    revalidatePath('/admin/productos')
    return { success: true }
  }

  async function deleteProduct(fd: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(fd.get('id') || '')
    if (!id) return
    await supabase.from('products').delete().eq('id', id)
    revalidatePath('/admin/productos')
    redirect('/admin/productos')
  }

  async function createVariant(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const product_id = String(fd.get('product_id') || '')
    const name = String(fd.get('variant_name') || '').trim()
    const color_hex = String(fd.get('variant_color_hex') || '').trim() || null
    if (!product_id || !name) return { error: 'Datos incompletos' }
    let image_url: string | null = null
    const vf = fd.get('variant_image') as File | null
    if (vf && typeof vf === 'object' && 'arrayBuffer' in vf && (vf as File).size > 0) {
      const ab = await (vf as File).arrayBuffer()
      const ext = (vf as File).type?.split('/')?.[1] || 'jpg'
      const path = `${randomUUID()}.${ext}`
      const bucket = supabase.storage.from('product-images')
      const { error: upErr } = await bucket.upload(path, Buffer.from(ab), { contentType: (vf as File).type || 'image/jpeg', upsert: true })
      if (upErr) return { error: `No se pudo subir la imagen de la variante: ${upErr.message}` }
      const pub = bucket.getPublicUrl(path)
      image_url = pub.data.publicUrl
    }
    const { error } = await supabase.from('product_variants').insert({ product_id, name, color_hex, image_url })
    if (error) return { error: error.message }
    revalidatePath(`/admin/productos?edit=${product_id}`)
    return { success: true }
  }

  async function deleteVariant(_: any, fd: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(fd.get('variant_id') || '')
    if (!id) return { error: 'Falta id' }
    const { data: row } = await supabase.from('product_variants').select('product_id').eq('id', id).single()
    await supabase.from('product_variants').delete().eq('id', id)
    if (row?.product_id) revalidatePath(`/admin/productos?edit=${row.product_id}`)
    return { success: true }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn">Volver a Agenda</Link>
        </div>
      </div>

      <ProductForm categories={categories || []} initial={initial} variants={variants} action={upsertProduct} createCategory={createCategory} createVariant={createVariant} deleteVariant={deleteVariant} />

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
              <a href={`/admin/productos?edit=${p.id}`} className="rounded-md border px-3 py-1.5 text-sm">Editar</a>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className="btn bg-gray-900 hover:bg-black">Eliminar</button>
              </form>
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
