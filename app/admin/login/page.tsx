import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin')

  async function signIn(formData: FormData) {
    'use server'
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) redirect('/admin')
  }

  return (
    <form action={signIn} className="space-y-4 max-w-sm">
      <h1 className="text-2xl font-semibold">Login Admin</h1>
      <input name="email" type="email" placeholder="tu@correo.com" className="w-full border rounded px-3 py-2" required />
      <input name="password" type="password" placeholder="contraseña" className="w-full border rounded px-3 py-2" required />
      <button className="btn">Ingresar</button>
      <p className="text-sm text-gray-500">El usuario debe existir en Supabase Auth y coincidir con ADMIN_EMAIL.</p>
    </form>
  )
}
