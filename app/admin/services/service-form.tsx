'use client'

import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'

type Category = { id: string; name: string }

type TimeWindow = { id?: string; weekday: number; start_time: string; end_time: string }

type Props = {
  categories: Category[]
  action: (prevState: any, formData: FormData) => Promise<{ success?: boolean; error?: string } | undefined>
  initial?: any | null
  createCategory?: (prevState: any, formData: FormData) => Promise<{ success?: boolean; error?: string } | undefined>
  windows?: TimeWindow[]
}

export default function ServiceForm({ categories, action, initial, createCategory, windows = [] }: Props){
  const [state, formAction] = useFormState(action, null as any)
  const [catState, catAction] = useFormState(createCategory || (async()=>undefined) as any, null as any)
  const [mainPreview, setMainPreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [tw, setTw] = useState<TimeWindow[]>(windows)

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview)
      galleryPreviews.forEach(u => URL.revokeObjectURL(u))
    }
  }, [mainPreview, galleryPreviews])

  return (
    <form action={formAction} className="card space-y-6" encType="multipart/form-data">
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">Guardado</div>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}
        <div className="space-y-2">
          <h3 className="font-medium">Básicos</h3>
          <input name="name" placeholder="Nombre" className="w-full border rounded px-3 py-2" required defaultValue={initial?.name || ''} />
          <div className="grid grid-cols-2 gap-2">
            <select name="category_id" className="border rounded px-3 py-2" defaultValue={initial?.category_id || ''}>
              <option value="">Sin categoría</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="space-y-1">
              <form action={catAction} className="flex gap-2">
                <input name="name" placeholder="Nueva categoría" className="border rounded px-3 py-2 w-full" />
                <button type="submit" className="rounded-md border px-3 py-2 text-sm">Agregar</button>
              </form>
              {catState?.error && <div className="text-xs text-red-600">{catState.error}</div>}
              {catState?.success && <div className="text-xs text-green-600">Categoría creada</div>}
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={initial?.is_active ?? true} /> Activo</label>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Duración y Precio</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Duración</label>
              <input name="duration_hhmm" type="time" step="60" className="w-full border rounded px-3 py-2" defaultValue={initial?.duration_minutes ? `${String(Math.floor(initial.duration_minutes/60)).padStart(2,'0')}:${String(initial.duration_minutes%60).padStart(2,'0')}` : ''} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Precio</label>
              <input name="price" type="number" min="0" step="100" className="w-full border rounded px-3 py-2" required defaultValue={initial?.price ?? ''} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descripción</label>
            <textarea name="description" className="w-full border rounded px-3 py-2 min-h-[72px]" placeholder="Descripción breve del servicio" defaultValue={initial?.description || ''} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Agenda</h3>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Intervalo de turnos</label>
            <select name="slot_interval_minutes" defaultValue={initial?.slot_interval_minutes ?? 60} className="w-full border rounded px-3 py-2">
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Franjas por día</div>
          <div className="space-y-2">
            {tw.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <select name="tw_weekday" defaultValue={row.weekday} className="col-span-4 border rounded px-3 py-2">
                  <option value={0}>Domingo</option>
                  <option value={1}>Lunes</option>
                  <option value={2}>Martes</option>
                  <option value={3}>Miércoles</option>
                  <option value={4}>Jueves</option>
                  <option value={5}>Viernes</option>
                  <option value={6}>Sábado</option>
                </select>
                <input name="tw_start" type="time" defaultValue={row.start_time} className="col-span-3 border rounded px-3 py-2" />
                <input name="tw_end" type="time" defaultValue={row.end_time} className="col-span-3 border rounded px-3 py-2" />
                <button type="button" className="col-span-2 rounded-md border px-3 py-2 text-sm" onClick={() => setTw(tw.filter((_,i)=>i!==idx))}>Eliminar</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => setTw([...tw, { weekday: 1, start_time: '09:00', end_time: '13:00' }])}
          >Agregar franja</button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium">Imágenes</h3>
          {(!mainPreview && initial?.image_url) && (
            <div className="text-xs text-gray-600">Imagen actual</div>
          )}
          <div className="flex gap-3 items-start">
            <input
              name="image_file"
              type="file"
              accept="image/*"
              className="border rounded px-3 py-2"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  const url = URL.createObjectURL(f)
                  setMainPreview(prev => {
                    if (prev) URL.revokeObjectURL(prev)
                    return url
                  })
                } else {
                  setMainPreview(null)
                }
              }}
            />
            {(mainPreview || initial?.image_url) && (
              <img src={mainPreview || initial?.image_url} alt="preview" className="w-24 h-24 object-cover rounded border" />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Galería (múltiples imágenes)</label>
            <input
              name="gallery_files"
              type="file"
              multiple
              accept="image/*"
              className="w-full border rounded px-3 py-2"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                const urls = files.map(f => URL.createObjectURL(f))
                // revoke previous
                setGalleryPreviews(prev => {
                  prev.forEach(u => URL.revokeObjectURL(u))
                  return urls
                })
              }}
            />
            {!!galleryPreviews.length && (
              <div className="flex flex-wrap gap-2 mt-2">
                {galleryPreviews.slice(0,6).map((u, i) => (
                  <img key={i} src={u} alt="galeria" className="w-16 h-16 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Lo que incluye</h3>
          <textarea name="includes" className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder={'Ej.:\n• Limado y forma de uñas\n• Tratamiento de cutículas'} defaultValue={(initial?.includes || [])?.join('\n')} />
          <p className="text-xs text-gray-500">Ingresá una línea por cada punto. Se mostrará como una lista en la ficha.</p>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn">Guardar</button>
      </div>
    </form>
  )
}
