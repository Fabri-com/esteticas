export function buildWhatsAppLink(businessPhone: string, text: string) {
  return `https://wa.me/${businessPhone}?text=${encodeURIComponent(text)}`
}
