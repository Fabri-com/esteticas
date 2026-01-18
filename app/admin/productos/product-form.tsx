'use client'

import { useFormState } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

type Category = { id: string; name: string }

type Variant = { id?: string; name: string; color_hex?: string; image_url?: string }

type Props = {
  categories: Category[]
  initial?: any | null
  variants?: Variant[]
  action: (prev: any, fd: FormData) => Promise<any>
  createCategory?: (prev: any, fd: FormData) => Promise<any>
  createVariant?: (prev: any, fd: FormData) => Promise<any>
  deleteVariant?: (prev: any, fd: FormData) => Promise<any>
}

export default function ProductForm({ categories, initial, variants = [], action, createCategory, createVariant, deleteVariant }: Props){
  const [state, formAction] = useFormState(action, null as any)
  const [catState, catAction] = useFormState(createCategory || (async()=>undefined) as any, null as any)
  const [vState, vAction] = useFormState(createVariant || (async()=>undefined) as any, null as any)
  const [delVState, delVAction] = useFormState(deleteVariant || (async()=>undefined) as any, null as any)
  const [mainPreview, setMainPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement|null>(null)

  useEffect(() => {
    if (state?.success && !initial?.id && formRef.current) formRef.current.reset()
  }, [state?.success, initial?.id])

  return (
    <div className="space-y-6">
      <div className="card space-y-2 border-pink-200">
        <h3 className="font-medium text-pink-700">Categorías</h3>
        <form action={catAction} className="flex gap-2">
          <input name="new_category_name" placeholder="Nueva categoría" className="border rounded px-3 py-2 w-full" />
          <button className="btn">Agregar</button>
        </form>
        {catState?.error && <div className="text-xs text-red-600">{catState.error}</div>}
        {catState?.success && <div className="text-xs text-green-600">Categoría creada</div>}
      </div>

      <form ref={formRef} action={formAction} className="card space-y-6 border-pink-200" encType="multipart/form-data">
        {initial?.id && <input type="hidden" name="id" value={initial.id} />}
        {state?.error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{state.error}</div>}
        {state?.success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">Guardado</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs text-gray-600">Nombre</label>
            <input name="name" defaultValue={initial?.name || ''} className="w-full border rounded px-3 py-2" required />
            <label className="block text-xs text-gray-600">Categoría</label>
            <select name="category_id" defaultValue={initial?.category_id || ''} className="w-full border rounded px-3 py-2">
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-xs text-gray-600">Precio</label>
            <input name="price" type="number" min="0" step="100" defaultValue={initial?.price ?? ''} className="w-full border rounded px-3 py-2" />
            <label className="block text-xs text-gray-600">Descripción</label>
            <textarea name="description" defaultValue={initial?.description || ''} className="w-full border rounded px-3 py-2 min-h-[96px]" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-gray-600">Imagen principal</label>
            <input name="image_file" type="file" accept="image/*" className="w-full border rounded px-3 py-2" onChange={(e)=>{
              const f = e.target.files?.[0]; if (!f) return setMainPreview(null); const u = URL.createObjectURL(f); if (mainPreview) URL.revokeObjectURL(mainPreview); setMainPreview(u)
            }} />
            {(mainPreview || initial?.image_url) && (
              <img src={mainPreview || initial?.image_url} alt="preview" className="w-24 h-24 object-cover rounded border" />
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn">Guardar producto</button>
        </div>
      </form>

      {initial?.id && (
        <div className="card space-y-4 border-pink-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-pink-700">Variantes (colores)</h3>
          </div>
          <form action={vAction} className="grid md:grid-cols-5 gap-2 items-end" encType="multipart/form-data">
            <input type="hidden" name="product_id" value={initial.id} />
            <div>
              <label className="block text-xs text-gray-600">Nombre</label>
              <input name="variant_name" className="w-full border rounded px-3 py-2" placeholder="Rosa" />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Color</label>
              <input name="variant_color_hex" type="color" className="w-full border rounded px-3 py-2 h-[42px]" defaultValue="#ff6699" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600">Imagen</label>
              <input name="variant_image" type="file" accept="image/*" className="w-full border rounded px-3 py-2" />
            </div>
            <button className="btn">Agregar variante</button>
          </form>
          <div className="space-y-2">
            {variants.map(v => (
              <div key={v.id || v.name} className="grid md:grid-cols-6 gap-2 items-center">
                {v.image_url ? <img src={v.image_url} alt={v.name} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 rounded border" style={{ background: v.color_hex || '#eee' }} />}
                <div className="md:col-span-3">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-gray-600">{v.color_hex}</div>
                </div>
                <form action={delVAction} className="flex justify-end">
                  <input type="hidden" name="variant_id" value={v.id} />
                  <button className="rounded-md border px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 border-red-300">Eliminar</button>
                </form>
              </div>
            ))}
            {variants.length === 0 && (
              <div className="text-sm text-gray-600">Aún no hay variantes.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
