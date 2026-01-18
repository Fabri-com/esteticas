'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [showTw, setShowTw] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  const toMinutes = (hhmm: string) => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number)
    return (h||0) * 60 + (m||0)
  }

  // Detectar solapamientos por día
  const overlapIdx = useMemo(() => {
    const bad = new Set<number>()
    const byDay: Record<number, Array<{ idx: number, start: number, end: number }>> = {}
    tw.forEach((r, i) => {
      const start = toMinutes(r.start_time)
      const end = toMinutes(r.end_time)
      if (!byDay[r.weekday]) byDay[r.weekday] = []
      byDay[r.weekday].push({ idx: i, start, end })
    })
    Object.values(byDay).forEach(list => {
      list.sort((a,b)=>a.start-b.start)
      let prev = null as null | { idx:number,start:number,end:number }
      for (const cur of list) {
        if (prev && cur.start < (prev.end||0)) {
          bad.add(cur.idx); bad.add(prev.idx)
        }
        prev = cur
      }
    })
    return bad
  }, [tw])

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview)
      galleryPreviews.forEach(u => URL.revokeObjectURL(u))
    }
  }, [mainPreview, galleryPreviews])

  useEffect(() => {
    if (catState?.success) router.refresh()
  }, [catState?.success, router])

  // Limpieza automática luego de guardar
  useEffect(() => {
    if (!state?.success) return
    // Si estaba editando, volvemos a /admin/services sin query y refrescamos
    if (initial?.id) {
      router.replace('/admin/services')
      router.refresh()
      return
    }
    // Si es creación, reseteamos formulario y estados locales
    if (formRef.current) {
      formRef.current.reset()
    }
    setMainPreview(null)
    setGalleryPreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return [] })
    setTw([])
    setShowTw(false)
  }, [state?.success, initial?.id, router])

  return (
    <>
      <div className="card space-y-2 mb-4 border-pink-200">
        <h3 className="font-medium text-pink-700">Categorías</h3>
        <form action={catAction} className="flex gap-2">
          <input name="new_category_name" placeholder="Nueva categoría" className="border rounded px-3 py-2 w-full focus:border-pink-400 focus:ring-1 focus:ring-pink-300" />
          <button type="submit" className="rounded-md border px-3 py-2 text-sm bg-pink-500 text-white hover:bg-pink-600">Agregar</button>
        </form>
        {catState?.error && <div className="text-xs text-red-600">{catState.error}</div>}
        {catState?.success && <div className="text-xs text-green-600">Categoría creada</div>}
      </div>

      <form ref={formRef} action={formAction} className="card space-y-8 border-pink-200" encType="multipart/form-data">
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">Guardado</div>
      )}

      <section className="grid md:grid-cols-2 gap-6">
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}
        <div className="space-y-3 p-3 rounded border border-pink-200 bg-pink-50/30">
          <h3 className="font-medium text-pink-700">Básicos</h3>
          <input name="name" placeholder="Nombre" className="w-full border rounded px-3 py-2" required defaultValue={initial?.name || ''} />
          <div className="grid grid-cols-2 gap-2">
            <select name="category_id" className="border rounded px-3 py-2" defaultValue={initial?.category_id || ''}>
              <option value="">Sin categoría</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div />
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={initial?.is_active ?? true} /> Activo</label>
        </div>
        <div className="space-y-3 p-3 rounded border border-pink-200 bg-pink-50/30">
          <h3 className="font-medium text-pink-700">Duración y Precio</h3>
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

      <section className="space-y-4 p-3 rounded border border-pink-200 bg-pink-50/30">
        <h3 className="font-medium text-pink-700">Agenda</h3>
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
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 text-sm text-gray-600">Editar Lunes a Viernes (hasta 2 bloques)</div>
            <label className="col-span-12 text-xs text-gray-600">Bloque 1</label>
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="09:00" />
            <span className="col-span-1 text-center">a</span>
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="13:00" />
            <div className="col-span-12" />
            <label className="col-span-12 text-xs text-gray-600">Bloque 2 (opcional)</label>
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="16:00" />
            <span className="col-span-1 text-center">a</span>
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="22:00" />
            <button type="button" className="col-span-12 rounded-md border px-3 py-2 text-sm bg-pink-500 text-white hover:bg-pink-600" onClick={(e)=>{
              const wrap = (e.currentTarget.parentElement as HTMLElement)
              const inputs = Array.from(wrap.querySelectorAll('input[type="time"]')) as HTMLInputElement[]
              const b1s = inputs[0]?.value || ''
              const b1e = inputs[1]?.value || ''
              const b2s = inputs[2]?.value || ''
              const b2e = inputs[3]?.value || ''
              setTw(prev => {
                // remover L-V existentes
                const rest = prev.filter(w => w.weekday < 1 || w.weekday > 5)
                const next: TimeWindow[] = [...rest]
                if (b1s && b1e) { for (let d=1; d<=5; d++) next.push({ weekday: d, start_time: b1s, end_time: b1e }) }
                if (b2s && b2e) { for (let d=1; d<=5; d++) next.push({ weekday: d, start_time: b2s, end_time: b2e }) }
                return next
              })
              setShowTw(false)
            }}>Aplicar a L–V</button>
          </div>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 text-sm text-gray-600">Agregar rápido Sábado</div>
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="09:00" />
            <input type="time" className="col-span-4 border rounded px-3 py-2" defaultValue="13:00" />
            <button type="button" className="col-span-4 rounded-md border px-3 py-2 text-sm bg-pink-500 text-white hover:bg-pink-600" onClick={(e)=>{
              const wrap = (e.currentTarget.parentElement as HTMLElement)
              const inputs = Array.from(wrap.querySelectorAll('input[type="time"]')) as HTMLInputElement[]
              const s = inputs[0]?.value || '09:00'
              const t = inputs[1]?.value || '13:00'
              setTw(prev => ([...prev, { weekday: 6, start_time: s, end_time: t }]))
            }}>Agregar</button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Franjas por día</div>
            <button type="button" className="text-sm text-pink-700 hover:underline" onClick={()=>setShowTw(s=>!s)}>
              {showTw ? 'Ocultar' : 'Ver'} ({tw.length})
            </button>
          </div>
          {showTw && (
            <div className="space-y-2">
              {tw.map((row, idx) => (
                <div key={idx} className={`grid grid-cols-12 gap-2 items-end ${overlapIdx.has(idx) ? 'bg-red-50 border border-red-300 rounded p-2' : ''}`}>
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
                  <button type="button" className="col-span-2 rounded-md border px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600" onClick={() => setTw(tw.filter((_,i)=>i!==idx))}>Eliminar</button>
                  {overlapIdx.has(idx) && (
                    <div className="col-span-12 text-xs text-red-700 mt-1">Esta franja se solapa con otra del mismo día</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm bg-pink-500 text-white hover:bg-pink-600"
              onClick={() => setTw([...tw, { weekday: 1, start_time: '09:00', end_time: '13:00' }])}
            >Agregar franja</button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 border-red-300"
              onClick={() => setTw([])}
            >Limpiar todas</button>
          </div>
          {!!overlapIdx.size && (
            <div className="mt-2 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              Hay franjas solapadas. Podés guardar igual, pero te recomiendo ajustarlas para evitar confusión en la agenda.
            </div>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium text-pink-700">Imágenes</h3>
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
        {/* Enviar siempre las franjas aunque esté colapsado */}
        <input type="hidden" name="tw_json" value={JSON.stringify(tw)} />
        <button className="btn">Guardar</button>
      </div>
    </form>
    </>
  )
}
