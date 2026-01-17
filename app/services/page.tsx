import { createClient } from '@/lib/supabase/server'

export default async function ServicesPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('services')
    .select('id,name,description,duration_minutes,price,image_url,category,category_id')
    .eq('is_active', true)
    .order('category', { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Servicios</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.map(s => (
          <div key={s.id} className="card flex gap-4">
            {s.image_url ? (
              <img src={s.image_url} alt={s.name} className="w-24 h-24 rounded object-cover border" />
            ) : null}
            <div className="flex-1 flex justify-between">
              <div>
                <h3 className="font-medium">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">${'{'}Number(s.price ?? 0).toFixed(0){'}'}</div>
                <div className="text-xs text-gray-500">{s.duration_minutes} min</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
