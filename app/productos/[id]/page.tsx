'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProductoDetalle({ params }: { params: { id: string } }){
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [p, setP] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id,name,price,image_url,description, product_categories(name)')
        .eq('id', id)
        .maybeSingle()
      // product_categories puede venir como objeto o como array según el cliente
      const catName = Array.isArray((data as any)?.product_categories)
        ? (data as any).product_categories[0]?.name
        : (data as any)?.product_categories?.name
      setP(data ? {
        id: data.id,
        name: data.name,
        price: Number(data.price||0),
        image_url: data.image_url,
        description: data.description,
        category_name: catName || undefined,
      } : null)
      setLoading(false)
    }
    run()
  }, [id])

  const formatPrice = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

  const consultar = () => {
    if (!p) return
    const text = encodeURIComponent(`Hola! Me interesa el producto "${p.name}" (${formatPrice(p.price)}). ¿Podrían darme más info?`)
    const url = `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="text-sm text-gray-500">Cargando…</div>
  if (!p) return <div className="text-sm text-gray-500">Producto no encontrado.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/productos" className="text-sm text-pink-600">← Volver a productos</Link>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border bg-white aspect-[4/3] relative">
          {p.image_url ? (
            <Image src={p.image_url} alt={p.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
          )}
        </div>
        <div className="space-y-3">
          {p.category_name && <div className="text-xs text-gray-500">{p.category_name}</div>}
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <div className="text-pink-600 font-semibold">{formatPrice(p.price)}</div>
          {p.description && (
            <div className="prose prose-sm max-w-none"><p>{p.description}</p></div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={consultar} className="px-3 py-2 rounded bg-pink-500 text-white">Consultar por WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  )
}
