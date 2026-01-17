export function normalizeArPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('54')) return digits
  if (digits.startsWith('0')) return `54${digits.slice(1)}`
  if (digits.length === 10 || digits.length === 11) return `54${digits}`
  return digits
}
