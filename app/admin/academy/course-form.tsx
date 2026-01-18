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
  // Structured editors
  type Module = { title: string; items: string[] }
  const [program, setProgram] = useState<Module[]>(initial?.program_json || [])
  const [requirements, setRequirements] = useState<string[]>(initial?.requirements_json || [])
  const [includes, setIncludes] = useState<string[]>(initial?.includes_json || [])

  useEffect(() => {
    setImagePreview(initial?.image_url || null)
    if (initial?.program_json) setProgram(initial.program_json)
    if (initial?.requirements_json) setRequirements(initial.requirements_json)
    if (initial?.includes_json) setIncludes(initial.includes_json)
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
            <label className="text-sm">Cupos disponibles</label>
            <input name="seats_available" type="number" min={0} defaultValue={initial?.seats_available ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Precio (ARS)</label>
            <input name="price" type="number" min={0} step="1" defaultValue={initial?.price ?? ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Modalidad</label>
            <input name="mode" defaultValue={initial?.mode || ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Inicio (fecha)</label>
            <input name="start_date" type="date" defaultValue={initial?.start_date || ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm">Horarios (texto)</label>
            <input name="schedule_text" defaultValue={initial?.schedule_text || ''} placeholder="Martes y Jueves, 18:00 - 21:00 hs" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Profesor/a</label>
            <input name="teacher" defaultValue={initial?.teacher || ''} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="certificate_included" name="certificate_included" type="checkbox" defaultChecked={!!initial?.certificate_included} />
            <label htmlFor="certificate_included" className="text-sm">Certificado incluido</label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Descripción</label>
          <textarea name="description" defaultValue={initial?.description || ''} rows={4} className="w-full border rounded px-3 py-2" />
        </div>

        {/* Structured editors */}
        <div className="space-y-4 p-3 rounded border border-pink-200 bg-pink-50/30">
          <h3 className="font-medium text-pink-700">Programa (módulos)</h3>
          <div className="space-y-3">
            {program.map((m, mi) => (
              <div key={mi} className="rounded border bg-white p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder={`Módulo ${mi+1}: título`}
                    value={m.title}
                    onChange={e=>setProgram(prev=>prev.map((mm,i)=> i===mi ? { ...mm, title: e.target.value } : mm))}
                  />
                  <button type="button" className="rounded border px-2 py-1 text-sm bg-red-50 text-red-700" onClick={()=>setProgram(program.filter((_,i)=>i!==mi))}>Eliminar</button>
                </div>
                <div className="space-y-2">
                  {m.items.map((it, ii) => (
                    <div key={ii} className="flex gap-2 items-center">
                      <input className="w-full border rounded px-2 py-1 text-sm" placeholder={`Ítem ${ii+1}`} value={it} onChange={e=>setProgram(prev=>prev.map((mm,i)=> i===mi ? { ...mm, items: mm.items.map((v,j)=> j===ii ? e.target.value : v) } : mm))} />
                      <button type="button" className="rounded border px-2 py-1 text-sm" onClick={()=>setProgram(prev=>prev.map((mm,i)=> i===mi ? { ...mm, items: mm.items.filter((_,j)=>j!==ii) } : mm))}>Quitar</button>
                    </div>
                  ))}
                  <button type="button" className="rounded border px-2 py-1 text-sm bg-pink-500 text-white" onClick={()=>setProgram(prev=>prev.map((mm,i)=> i===mi ? { ...mm, items: [...mm.items, ''] } : mm))}>Agregar ítem</button>
                </div>
              </div>
            ))}
            <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={()=>setProgram([...program, { title: '', items: [''] }])}>Agregar módulo</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 p-3 rounded border border-pink-200 bg-pink-50/30">
            <h3 className="font-medium text-pink-700">Requisitos</h3>
            {requirements.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="w-full border rounded px-2 py-1 text-sm" placeholder={`Requisito ${i+1}`} value={r} onChange={e=>setRequirements(prev=>prev.map((v,ii)=> ii===i ? e.target.value : v))} />
                <button type="button" className="rounded border px-2 py-1 text-sm" onClick={()=>setRequirements(requirements.filter((_,ii)=>ii!==i))}>Quitar</button>
              </div>
            ))}
            <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={()=>setRequirements([...requirements, ''])}>Agregar requisito</button>
          </div>
          <div className="space-y-2 p-3 rounded border border-pink-200 bg-pink-50/30">
            <h3 className="font-medium text-pink-700">Incluye</h3>
            {includes.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="w-full border rounded px-2 py-1 text-sm" placeholder={`Ítem ${i+1}`} value={r} onChange={e=>setIncludes(prev=>prev.map((v,ii)=> ii===i ? e.target.value : v))} />
                <button type="button" className="rounded border px-2 py-1 text-sm" onClick={()=>setIncludes(includes.filter((_,ii)=>ii!==i))}>Quitar</button>
              </div>
            ))}
            <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={()=>setIncludes([...includes, ''])}>Agregar ítem</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm">Programa (Markdown)</label>
            <textarea name="program_md" defaultValue={initial?.program_md || ''} rows={8} className="w-full border rounded px-3 py-2" placeholder="" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm">Requisitos (Markdown)</label>
            <textarea name="requirements_md" defaultValue={initial?.requirements_md || ''} rows={8} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm">Incluye (Markdown)</label>
            <textarea name="includes_md" defaultValue={initial?.includes_md || ''} rows={8} className="w-full border rounded px-3 py-2" />
          </div>
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
          {/* Hidden JSON payloads */}
          <input type="hidden" name="program_json" value={JSON.stringify(program)} />
          <input type="hidden" name="requirements_json" value={JSON.stringify(requirements)} />
          <input type="hidden" name="includes_json" value={JSON.stringify(includes)} />
          <button className="px-4 py-2 rounded bg-pink-500 text-white">Guardar</button>
        </div>
      </form>
      </div>
    </div>
  )
}
