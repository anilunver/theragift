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
          <div key={dateStr} className={`bg-white border rounded-2xl p-3 min-h-[160px] shadow-sm ${isToday ? 'border-brand ring-1 ring-brand/30' : 'border-border'}`}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted">{DAY_LABELS[idx]}</div>
                <div className={`text-sm font-extrabold ${isToday ? 'text-brand-light' : 'text-ink'}`}>{date.getDate()}.{date.getMonth() + 1}</div>
              </div>
              {isToday && <span className="text-[10px] font-bold text-brand-light bg-brand-soft px-2 py-0.5 rounded-full">Bugün</span>}
            </div>

            {block && (
              <button
                type="button"
                onClick={() => onBlockClick && onBlockClick(block)}
                className={`mb-2 w-full text-left text-[10px] font-bold px-2 py-1 rounded-lg transition-opacity hover:opacity-80 ${UNAVAILABLE_BLOCK_TYPE_STYLES[block.type] || 'bg-gray-200 text-gray-700'}`}
              >
                {unavailableBlockTypeLabel(block.type, block.title)}
                {!block.fullDay && block.startTime && ` (${formatTime(block.startTime)} - ${formatTime(block.endTime)})`}
                {block.affectedAppointmentsCount > 0 && (
                  <div className="mt-1 font-semibold normal-case">⚠️ Bu blokta planlı randevu var</div>
                )}
              </button>
            )}

            <div className={`space-y-1.5 ${dayAppointments.length > 4 ? 'max-h-[190px] overflow-y-auto pr-0.5' : ''}`}>
              {dayAppointments.length === 0 && <div className="text-[11px] text-muted">Randevu yok</div>}
              {dayAppointments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAppointment(a)}
                  className={`w-full text-left text-[11px] px-2 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 ${STATUS_STYLES[a.status] || 'bg-brand-soft text-brand-dark border border-transparent'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PAYMENT_DOT_STYLES[a.paymentStatus] || 'bg-gray-300'}`} />
                    <span className="font-bold shrink-0">{formatTime(a.startTime)}–{formatTime(a.endTime)}</span>
                  </div>
                  <div className="truncate mt-0.5 font-medium">{a.clientFullName}</div>
                  {a.outOfWorkingHours && (
                    <span className="mt-1 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Mesai dışı</span>
                  )}
                </button>
              ))}
            </div>

            {onQuickClose && !block && (
              <button
                type="button"
                onClick={() => onQuickClose(dateStr)}
                className="mt-2 w-full text-[10px] font-medium text-muted/70 hover:text-muted border border-dashed border-border/70 rounded-lg py-1 transition-colors"
              >
                Bu günü kapat
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
