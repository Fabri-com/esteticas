import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: photos } = await supabase
    .from('home_photos')
    .select('id,kind,title,alt,public_url,sort_order')
    .eq('is_active', true)
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  const hero = (photos||[]).find(p => p.kind === 'hero')
  const gallery = (photos||[]).filter(p => p.kind === 'gallery')
  const prodImg = gallery[0]
  const academyImg = gallery[1]
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-100 to-white">
        <div className="absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(ellipse at top left, rgba(244,114,182,0.4), transparent 40%), radial-gradient(ellipse at bottom right, rgba(219,39,119,0.25), transparent 40%)'}} />
        <div className="relative px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Tu belleza es nuestra pasión</h1>
            <p className="text-base md:text-lg text-gray-600 mb-8">Descubrí nuestros servicios profesionales: manicura, pestañas, pedicure, skincare y combos. Formación en nuestra academia.</p>
            <div className="flex gap-3">
              <Link href="/booking" className="btn">Sacar turno</Link>
              <Link href="/services" className="btn bg-gray-900 hover:bg-black">Ver servicios</Link>
            </div>
          </div>
          {hero ? (
            <img src={hero.public_url} alt={hero.alt||hero.title||'Foto principal'} className="aspect-video w-full object-cover border rounded-xl shadow-sm" />
          ) : (
            <div className="aspect-video bg-white/70 border rounded-xl shadow-sm" />
          )}
        </div>
      </section>

      {/* Nuestros Servicios */}
      <section className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Nuestros Servicios</h2>
          <p className="text-gray-600">Una selección de servicios de belleza realizados por profesionales.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {title:'Manicura', desc:'Cuidado profesional de tus manos', emoji:'💅'},
            {title:'Pestañas', desc:'Extensiones y lifting', emoji:'👁️'},
            {title:'Pedicure', desc:'Spa para tus pies', emoji:'🦶'},
            {title:'Skincare', desc:'Tratamientos faciales', emoji:'✨'},
          ].map(card => (
            <div key={card.title} className="card text-center py-8">
              <div className="text-4xl mb-2">{card.emoji}</div>
              <div className="font-medium">{card.title}</div>
              <div className="text-sm text-gray-600">{card.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/services" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm">Ver todos los servicios</Link>
        </div>
      </section>

      {/* Productos */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        {prodImg ? (
          <img src={prodImg.public_url} alt={prodImg.alt||prodImg.title||'Productos'} className="aspect-[16/10] w-full rounded-xl border object-cover" />
        ) : (
          <div className="aspect-[16/10] rounded-xl border bg-pink-50" />
        )}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Productos de calidad premium</h3>
          <p className="text-gray-600">Descubrí nuestra selección de productos para el cuidado de tu belleza, las mismas marcas que usamos en el salón.</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Esmaltes de larga duración</li>
            <li>• Cremas y tratamientos faciales</li>
            <li>• Accesorios profesionales</li>
          </ul>
          <div>
            <a href="#" className="btn">Ver productos</a>
          </div>
        </div>
      </section>

      {/* Academia */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Aprendé con los mejores</h3>
          <p className="text-gray-600">Nuestra academia ofrece cursos profesionales con certificación y seguimiento personalizado.</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Profesores certificados</li>
            <li>• Grupos reducidos</li>
            <li>• Certificado oficial</li>
          </ul>
          <div>
            <Link href="/academy" className="btn">Conocer cursos</Link>
          </div>
        </div>
        {academyImg ? (
          <img src={academyImg.public_url} alt={academyImg.alt||academyImg.title||'Academia'} className="aspect-[16/10] w-full rounded-xl border object-cover" />
        ) : (
          <div className="aspect-[16/10] rounded-xl border bg-pink-50" />
        )}
      </section>

      {/* CTA final */}
      <section className="text-center space-y-4">
        <h3 className="text-lg font-semibold">¿Lista para lucir radiante?</h3>
        <p className="text-gray-600">Reservá tu turno online y disfrutá de una experiencia única.</p>
        <Link href="/booking" className="btn">Reservar ahora</Link>
      </section>
    </div>
  )
}
