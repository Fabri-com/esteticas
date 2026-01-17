import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from('services').select('id,name,duration_minutes,price').eq('is_active', true).order('name')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify(data || []), { status: 200 })
}
