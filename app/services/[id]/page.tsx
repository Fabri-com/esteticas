import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DuoIcon from '@/components/ui/duo-icon'

type Props = { params: { id: string } }

export default async function ServiceDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: service } = await supabase
    .from('services')
    .select('id,name,description,duration_minutes,price,image_url,category,category_id,includes,gallery_urls')
    .eq('id', params.id)
    .single()

  if (!service) return notFound()

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id,name')

  const catName = categories?.find(c => c.id === service.category_id)?.name || service.category || ''

  return (
    <div className="space-y-6">
      <Link href="/services" className="text-sm text-gray-600 hover:underline">← Volver a servicios</Link>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {service.image_url ? (
            <img src={service.image_url} alt={service.name} className="w-full aspect-[4/3] object-cover rounded-xl border" />
          ) : (
            <div className="w-full aspect-[4/3] bg-pink-50 rounded-xl border" />
          )}
          {!!(service.gallery_urls?.length) && (
            <div className="grid grid-cols-3 gap-3">
              {service.gallery_urls!.slice(0,3).map((u: string, i: number) => (
                <img key={i} src={u} alt="galeria" className="w-full aspect-[4/3] object-cover rounded-lg border" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {catName ? (
            <span className="inline-flex items-center gap-1 text-xs bg-pink-100 text-pink-700 rounded-full px-2 py-1">
              <DuoIcon name="list" className="w-3.5 h-3.5" /> {catName}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold">{service.name}</h1>
          <p className="text-gray-700">{service.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4 bg-white">
              <div className="text-xs text-gray-500 flex items-center gap-1"><DuoIcon name="timer" className="w-4 h-4" /> Duración</div>
              <div className="font-medium">{service.duration_minutes} minutos</div>
            </div>
            <div className="rounded-xl border p-4 bg-pink-50 text-pink-700">
              <div className="text-xs flex items-center gap-1"><DuoIcon name="money" className="w-4 h-4" /> Precio</div>
              <div className="font-semibold">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(service.price ?? 0))}</div>
            </div>
          </div>

          {!!(service.includes?.length) && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2"><DuoIcon name="gift" className="w-4 h-4" /> El servicio incluye</h3>
              <ul className="space-y-1 text-sm">
                {service.includes!.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><DuoIcon name="check" className="w-4 h-4" /><span>{it}</span></li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Link href={`/booking?service=${service.id}`} className="btn">Reservar este servicio</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
