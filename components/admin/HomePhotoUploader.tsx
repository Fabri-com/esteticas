'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HomePhotoUploader({ defaultKind }: { defaultKind: 'hero'|'gallery' }){
  const [file, setFile] = useState<File|null>(null)
  const [kind, setKind] = useState<'hero'|'gallery'>(defaultKind)
  const [title, setTitle] = useState('')
  const [alt, setAlt] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const onUpload = async () => {
    if (!file) { setMsg('Elegí una imagen'); return }
    setLoading(true); setMsg('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const name = `${kind}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('home').upload(name, file, { upsert: false, cacheControl: '3600' })
      if (upErr) { setMsg(upErr.message); setLoading(false); return }
      const { data: pub } = supabase.storage.from('home').getPublicUrl(name)
      const public_url = pub.publicUrl
      const { error: insErr } = await supabase.from('home_photos').insert({
        kind,
        title: title || null,
        alt: alt || null,
        storage_path: name,
        public_url,
      })
      if (insErr) { setMsg(insErr.message); setLoading(false); return }
      setMsg('Subido correctamente')
      setFile(null); setTitle(''); setAlt('')
    } catch (e: any) {
      setMsg(e?.message || 'Error al subir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <select className="border rounded px-2 py-1 text-sm" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="hero">Hero</option>
          <option value="gallery">Galería</option>
        </select>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
      </div>
      <input placeholder="Título (opcional)" className="w-full border rounded px-2 py-1 text-sm" value={title} onChange={e=>setTitle(e.target.value)} />
      <input placeholder="Alt (accesibilidad, opcional)" className="w-full border rounded px-2 py-1 text-sm" value={alt} onChange={e=>setAlt(e.target.value)} />
      <button type="button" className="btn" disabled={loading} onClick={onUpload}>{loading ? 'Subiendo...' : 'Subir'}</button>
      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </div>
  )
}
