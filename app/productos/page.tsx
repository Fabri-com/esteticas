'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Product = {
  id: string
  name: string
  price: number
  image_url?: string | null
  category_id?: string | null
  category_name?: string | null
}

type ProdCategory = { id: string; name: string; position: number }

export default function ProductosPage() {
  const [categories, setCategories] = useState<ProdCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: cats } = await supabase
        .from('product_categories')
        .select('id,name,position')
        .order('position', { ascending: true })
        .order('name', { ascending: true })
      setCategories(cats || [])
      const { data: prods } = await supabase
        .from('products')
        .select('id,name,price,image_url,category_id, product_categories(name)')
        .eq('active', true)
        .order('name', { ascending: true })
      const mapped: Product[] = (prods || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        image_url: p.image_url,
        category_id: p.category_id,
        category_name: p.product_categories?.name || undefined,
      }))
      setProducts(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products.filter(p => {
      const okCat = !categoryId || p.category_id === categoryId
      const okText = !term || p.name.toLowerCase().includes(term)
      return okCat && okText
    })
  }, [products, q, categoryId])

  const formatPrice = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

  const handleConsultar = (p: Product) => {
    const text = encodeURIComponent(`Hola! Me interesa el producto "${p.name}" (${formatPrice(p.price)}). ¿Podrían darme más info?`)
    const url = `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-gray-500">Descubrí nuestra línea de productos profesionales para el cuidado de tu belleza</p>
      </div>

      <div className="flex flex-col gap-3">
        <input
          placeholder="Buscar productos..."
          value={q}
          onChange={e=>setQ(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={()=>setCategoryId('')}
            className={`px-3 py-1 rounded-full border text-sm ${categoryId==='' ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`}
          >Todos</button>
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={()=>setCategoryId(c.id)}
              className={`px-3 py-1 rounded-full border text-sm ${categoryId===c.id ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`}
            >{c.name}</button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Cargando productos…</div>}

      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl overflow-hidden border bg-white">
              <div className="aspect-[16/10] bg-gray-100 relative">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
                )}
                {p.category_name && (
                  <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-white/90 border text-gray-700">{p.category_name}</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-pink-600 font-semibold">{formatPrice(p.price)}</div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/productos/${p.id}`} className="px-3 py-1 rounded border text-sm">Ver detalle</Link>
                  <button onClick={()=>handleConsultar(p)} className="px-3 py-1 rounded bg-pink-500 text-white text-sm">Consultar</button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="text-sm text-gray-500">No se encontraron productos.</div>
          )}
        </div>
      )}
    </div>
  )
}
