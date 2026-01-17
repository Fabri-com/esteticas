import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = (searchParams.get('phone') || '').replace(/\D/g,'')
  if (!phone) return new Response('null', { status: 200 })
  const supabase = createClient()
  const { data } = await supabase.from('customers').select('full_name,email,phone').eq('phone', phone).maybeSingle()
  return new Response(JSON.stringify(data || null), { status: 200 })
}
