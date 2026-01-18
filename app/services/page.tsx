import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DuoIcon from '@/components/ui/duo-icon'

type PageProps = { searchParams?: { cat?: string } }

export default async function ServicesPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: categoriesRaw } = await supabase
    .from('service_categories')
    .select('id,name')
    .order('name')
  const order = ['Manos', 'Pies', 'Pestañas', 'Skincare', 'Combos']
  const categories = (categoriesRaw || []).slice().sort((a, b) => {
    const ia = order.indexOf(a.name)
    const ib = order.indexOf(b.name)
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const cat = searchParams?.cat || ''

  let query = supabase
    .from('services')
    .select('id,name,description,duration_minutes,price,image_url,category,category_id')
    .eq('is_active', true)
    .order('name')

  if (cat) query = query.eq('category_id', cat)
  const { data } = await query

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Nuestros Servicios</h1>
        <p className="text-gray-600">Servicios profesionales de belleza realizados por expertas.</p>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Link href="/services" className={`px-3 py-1 rounded-full border text-sm ${!cat ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-pink-50'}`}>Todos</Link>
        {categories?.map(c => (
          <Link
            key={c.id}
            href={`/services?cat=${c.id}`}
            className={`px-3 py-1 rounded-full border text-sm ${cat === c.id ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-pink-50'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Tarjetas de servicios */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map(s => (
          <div key={s.id} className="card overflow-hidden">
            <div className="relative">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-full h-44 object-cover" />
              ) : <div className="w-full h-44 bg-pink-50" />}
              {(() => {
                const catName = categories?.find(c => c.id === s.category_id)?.name || s.category
                return catName ? (
                  <span className="absolute top-3 right-3 text-xs bg-white/90 border rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                    <DuoIcon name="list" className="w-3.5 h-3.5" /> {catName}
                  </span>
                ) : null
              })()}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{s.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{s.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold inline-flex items-center gap-1">
                    <DuoIcon name="money" className="w-4 h-4" />
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(s.price ?? 0))}
                  </div>
                  <div className="text-xs text-gray-500 inline-flex items-center gap-1"><DuoIcon name="timer" className="w-3.5 h-3.5" /> {s.duration_minutes} min</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link href={`/services/${s.id}`} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">Ver más</Link>
                <Link href="/booking" className="btn px-3 py-1.5 text-sm">Reservar</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
