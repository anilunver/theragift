import { formatTime, toIsoDateString, unavailableBlockTypeLabel, UNAVAILABLE_BLOCK_TYPE_STYLES } from '../utils/format.js'

const DAY_LABELS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

// weekStart her zaman local bir Date nesnesidir (Calendar.jsx'te getMonday() ile üretilir).
// Burada da tüm işlemler local Date üzerinden yapılır, toISOString() KULLANILMAZ
// (UTC dönüşümü gün kaymasına sebep olur).
function getWeekDates(weekStart) {
  const dates = []
  const start = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

// Randevu durumuna göre kart rengi (planlandı/tamamlandı/gelmedi/iptal)
const STATUS_STYLES = {
  SCHEDULED: 'bg-blue-50 text-blue-900 border border-blue-200',
  COMPLETED: 'bg-green-50 text-green-900 border border-green-200',
  NO_SHOW: 'bg-orange-50 text-orange-900 border border-orange-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200 line-through',
}

// Ödeme durumuna göre küçük nokta rengi
const PAYMENT_DOT_STYLES = {
  PAID: 'bg-green-500',
  UNPAID: 'bg-red-500',
  PAY_LATER: 'bg-amber-500',
  PARTIAL_PAID: 'bg-blue-500',
  PACKAGE_USED: 'bg-purple-500',
  CANCELLED: 'bg-gray-400',
  NO_SHOW: 'bg-gray-400',
  FREE: 'bg-teal-500',
}

// V2.2B: Bir tarihe denk gelen çalışma dışı/tatil bloğunu bulur. Tam gün blok
// varsa o öncelikli gösterilir; yoksa kısmi saat bloğu gösterilir.
function findBlockForDate(dateStr, blocks) {
  const matches = (blocks || []).filter((b) => b.startDate <= dateStr && b.endDate >= dateStr)
  if (matches.length === 0) return null
  return matches.find((b) => b.fullDay) || matches[0]
}

export default function WeeklyCalendar({ weekStart, appointments, unavailableBlocks, onSelectAppointment, onQuickClose, onBlockClick }) {
  const dates = getWeekDates(weekStart)

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {dates.map((date, idx) => {
        const dateStr = toIsoDateString(date)
        const dayAppointments = appointments
          .filter((a) => a.appointmentDate === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        const isToday = dateStr === toIsoDateString(new Date())
        const block = findBlockForDate(dateStr, unavailableBlocks)

        return (
          <div ke