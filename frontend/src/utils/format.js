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

// --- Tarih kayması (timezone) düzeltmesi ---
// ÖNEMLİ: "YYYY-MM-DD" gibi saat içermeyen ISO tarih string'lerini `new Date(str)`
// ile parse etmek, string'i UTC gece yarısı olarak yorumlar. Kullanıcının tarayıcı
// saat dilimi UTC'den farklıysa (örn. Türkiye +3), bu Date nesnesini local saatte
// okurken (getDay/getDate) veya `toISOString()` ile geri stringe çevirirken bir gün
// kaymasına yol açar. Bu yüzden ISO tarih string'leri HER ZAMAN elle (yıl, ay, gün)
// parçalanıp `new Date(y, m-1, d)` ile LOCAL tarih olarak oluşturulmalı; asla
// toISOString() ile geri stringe çevrilmemeli (o da UTC'ye çevirir).

// "2026-07-08" -> local Date(2026, 6, 8) — UTC dönüşümü yok, gün kayması olmaz.
export function parseLocalDate(value) {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

// Local bir Date nesnesini "YYYY-MM-DD" string'ine çevirir.
// toISOString() KULLANMAZ çünkü o UTC'ye çevirip gün kaydırabilir.
export function toIsoDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Bugünün tarihini local saat dilimine göre "YYYY-MM-DD" olarak döner.
export function todayIsoDate() {
  return toIsoDateString(new Date())
}

// Kısa gün adıyla birlikte tarih: "08.07.2026 (Çrş)"
export function formatDateWithDay(value) {
  if (!value) return '-'
  const date = parseLocalDate(value)
  if (!date || Number.isNaN(date.getTime())) return formatDate(value)
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
