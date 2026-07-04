// Ortak Türkçe format ve etiket yardımcıları.
// Amaç: Tüm sayfalarda tutarlı tarih/saat/para/isim gösterimi ve enum çevirileri.

export const APPOINTMENT_STATUS_LABELS = {
  SCHEDULED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
}

export const PAYMENT_STATUS_LABELS = {
  PAID: 'Ödendi',
  UNPAID: 'Ödenmedi',
  PAY_LATER: 'Sonra Ödenecek',
  PARTIAL_PAID: 'Kısmi Ödendi',
  PACKAGE_USED: 'Paketten Düşüldü',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
  FREE: 'Ücretsiz',
}

export const SESSION_TYPE_LABELS = {
  ONLINE: 'Online',
  FACE_TO_FACE: 'Yüz Yüze',
}

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Nakit',
  BANK_TRANSFER: 'Havale/EFT',
  CREDIT_CARD_MANUAL: 'Manuel Kart',
  ONLINE_LINK: 'Online Link',
  PACKAGE: 'Paket',
  OTHER: 'Diğer',
}

export const DAY_OF_WEEK_LABELS = {
  MONDAY: 'Pazartesi',
  TUESDAY: 'Salı',
  WEDNESDAY: 'Çarşamba',
  THURSDAY: 'Perşembe',
  FRIDAY: 'Cuma',
  SATURDAY: 'Cumartesi',
  SUNDAY: 'Pazar',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export function dayOfWeekLabel(value) {
  return DAY_OF_WEEK_LABELS[value] || value
}

export function dayOfWeekOrder(value) {
  const idx = DAY_ORDER.indexOf(value)
  return idx === -1 ? 99 : idx
}

export function appointmentStatusLabel(value) {
  return APPOINTMENT_STATUS_LABELS[value] || value
}

export function paymentStatusLabel(value) {
  return PAYMENT_STATUS_LABELS[value] || value
}

export function sessionTypeLabel(value) {
  return SESSION_TYPE_LABELS[value] || value
}

export function paymentMethodLabel(value) {
  return PAYMENT_METHOD_LABELS[value] || value
}

// "14:00:00" ya da "14:00" -> "14:00"
export function formatTime(value) {
  if (!value) return '-'
  return value.slice(0, 5)
}

// "2026-07-08" -> "08.07.2026"
export function formatDate(value) {
  if (!value) return '-'
  const parts = value.slice(0, 10).split('-')
  if (parts.length !== 3) return value
  const [year, month, day] = parts
  return `${day}.${month}.${year}`
}

// Kısa gün adıyla birlikte tarih: "08.07.2026 (Çrş)"
export function formatDateWithDay(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  const shortDays = ['Paz', 'Pzt', 'Sal', 'Çrş', 'Per', 'Cum', 'Cmt']
  return `${formatDate(value)} (${shortDays[date.getDay()]})`
}

// 1500 -> "₺1.500"
export function formatCurrency(value) {
  const number = Number(value || 0)
  return `₺${number.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`
}

// "zülleyha bıçak" -> "Züleyha Bıçak"
export function toTitleCase(value) {
  if (!value) return ''
  return value
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ')
}

export function fullNameTitleCase(firstName, lastName) {
  return toTitleCase(`${firstName || ''} ${lastName || ''}`.trim())
}
