'use client'

import { useActionState } from 'react'

type Category = { id: string; name: string }

type Props = {
  categories: Category[]
  action: (prevState: any, formData: FormData) => Promise<{ success?: boolean; error?: string } | undefined>
}

export default function ServiceForm({ categories, action }: Props){
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="card space-y-6" encType="multipart/form-data">
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">Guardado</div>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium">Básicos</h3>
          <input name="name" placeholder="Nombre" className="w-full border rounded px-3 py-2" required />
          <div className="grid grid-cols-2 gap-2">
            <select name="category_id" className="border rounded px-3 py-2">
              <option value="">Sin categoría</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input name="category" placeholder="Etiqueta opcional" className="border rounded px-3 py-2" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Activo</label>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Duración y Precio</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Duración</label>
              <input name="duration_hhmm" type="time" step="60" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Precio</label>
              <input name="price" type="number" min="0" step="100" className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descripción</label>
            <textarea name="description" className="w-full border rounded px-3 py-2 min-h-[72px]" placeholder="Descripción breve del servicio" />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium">Imágenes</h3>
          <input name="image_url" placeholder="URL imagen principal (opcional)" className="w-full border rounded px-3 py-2" />
          <input name="image_file" type="file" accept="image/*" className="w-full border rounded px-3 py-2" />
          <div>
            <label className="block text-xs text-gray-600 mb-1">Galería (múltiples imágenes)</label>
            <input name="gallery_files" type="file" multiple accept="image/*" className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Lo que incluye</h3>
          <textarea name="includes" className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder={'Ej.:\n• Limado y forma de uñas\n• Tratamiento de cutículas'} />
          <p className="text-xs text-gray-500">Ingresá una línea por cada punto. Se mostrará como una lista en la ficha.</p>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn">Guardar</button>
      </div>
    </form>
  )
}
