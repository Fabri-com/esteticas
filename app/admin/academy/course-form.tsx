'use client'

import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'

export default function CourseForm({
  categories,
  initial,
  action,
  createCategory,
}: {
  categories: any[]
  initial: any
  action: (prevState: any, fd: FormData) => Promise<any>
  createCategory: (prevState: any, fd: FormData) => Promise<any>
}){
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url || null)
  const [newCatName, setNewCatName] = useState('')
  const [state, formAction] = useFormState(action, null as any)
  const [catState, catAction] = useFormState(createCategory, null as any)

  useEffect(() => {
    setImagePreview(initial?.image_url || null)
  }, [initial])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setImagePreview(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-2 border-pink-200">
        <h3 className="font-medium text-pink-700">Categorías</h3>
        <form action={catAction} className="flex gap-2">
          <input name="new_category_name" value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Nueva categoría" className="border rounded px-3 py-2 w-full" />
          <button className="btn">Agregar</button>
        </form>
        {catState?.error && <div className="text-xs text-red-600">{catState.error}</div>}
        {catState?.success && <div className="text-xs text-green-600">Categoría creada</div>}
      </div>

      <div className="card">
        {state?.error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{state.error}</div>}
        {state?.success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">Guardado</div>}
        <form action={formAction} className="space-y-4" encType="multipart/form-data">
        <input type="hidden" name="id" defaultValue={initial?.id || ''} />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Título</label>
            <input name="title" defaultValue={initial?.title || ''} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Categoría</label>
            <select name="category_id" defaultValue={initial?.category_id || ''} className="w-full border rounded px-3 py-2">
              <option value="">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Nivel</label>
            <input name="level" defaultValue={initial?.level || ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Duración (semanas)</label>
            <input name="duration_weeks" type="number" min={0} defaultValue={initial?.duration_weeks ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Estudiantes</label>
            <input name="students" type="number" min={0} defaultValue={initial?.students ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Cupos</label>
            <input name="seats" type="number" min={0} defaultValue={initial?.seats ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Precio (ARS)</label>
            <input name="price" type="number" min={0} step="1" defaultValue={initial?.price ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Modalidad</label>
            <input name="mode" defaultValue={initial?.mode || ''} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Descripción</label>
          <textarea name="description" defaultValue={initial?.description || ''} rows={4} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <label className="text-sm">Imagen</label>
            <input type="file" name="image_file" accept="image/*" onChange={onFileChange} />
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-40 h-28 object-cover rounded border" />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-pink-500 text-white">Guardar</button>
        </div>
      </form>
      </div>
    </div>
  )
}
