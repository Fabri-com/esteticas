export default function AcademyPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Academia</h1>
      <p>Formate con nosotros. Escribinos por WhatsApp para más info.</p>
      <a className="btn" href={`https://wa.me/${process.env.BUSINESS_WHATSAPP_PHONE}`}>WhatsApp</a>
    </div>
  )
}
