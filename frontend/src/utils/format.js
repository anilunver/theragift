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

export const RECURRENCE_TYPE_LABELS = {
  WEEKLY: 'Her hafta',
  BIWEEKLY: 'İki haftada bir',
  MONTHLY: 'Ayda bir',
}

export function recurrenceTypeLabel(value) {
  return RECURRENCE_TYPE_LABELS[value] || value
}

// V2.2B: Çalışma dışı gün / tatil blok türleri.
export const UNAVAILABLE_BLOCK_TYPE_LABELS = {
  DAY_OFF: 'Çalışma dışı',
  VACATION: 'Tatil',
  PERSONAL: 'Özel iş',
  HOLIDAY: 'Resmi tatil',
  CUSTOM: 'Diğer',
}

// Badge renkleri — mevcut tasarım sistemine uygun sade tonlar.
export const UNAVAILABLE_BLOCK_TYPE_STYLES = {
  DAY_OFF: 'bg-gray-200 text-gray-700',
  VACATION: 'bg-purple-100 text-purple-800',
  PERSONAL: 'bg-amber-100 text-amber-800',
  HOLIDAY: 'bg-red-100 text-red-800',
  CUSTOM: 'bg-gray-200 text-gray-700',
}

export function unavailableBlockTypeLabel(value, customTitle) {
  if (value === 'CUSTOM' && customTitle) return customTitle
  return UNAVAILABLE_BLOCK_TYPE_LABELS[value] || value
}

// V2.2C: Danışan not defteri kategorileri.
export const CLIENT_NOTE_CATEGORY_LABELS = {
  GENERAL: 'Genel Not',
  SESSION: 'Seans Notu',
  PAYMENT: 'Ödeme Notu',
  AVAILABILITY: 'Uygunluk Notu',
  REMINDER: 'Hatırlatma',
  OTHER: 'Diğer',
}

export const CLIENT_NOTE_CATEGORY_STYLES = {
  GENERAL: 'bg-gray-200 text-gray-700',
  SESSION: 'bg-blue-100 text-blue-800',
  PAYMENT: 'bg-amber-100 text-amber-800',
  AVAILABILITY: 'bg-teal-100 text-teal-800',
  REMINDER: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-200 text-gray-700',
}

export function clientNoteCategoryLabel(value) {
  if (!value) return null
  return CLIENT_NOTE_CATEGORY_LABELS[value] || value
}

// Tam tarih + saat: "08.07.2026 14:30"
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'