import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="py-16 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h1 className="text-4xl font-bold mb-4">Cuidamos tu belleza</h1>
        <p className="text-lg text-gray-600 mb-6">Manicura, pestañas, pedicure, skincare, combos y formación profesional.</p>
        <div className="flex gap-3">
          <Link href="/booking" className="btn">Reservar</Link>
          <Link href="/services" className="btn bg-gray-900 hover:bg-black">Ver servicios</Link>
        </div>
      </div>
      <div className="h-64 bg-pink-100 rounded-lg" />
    </section>
  )
}
