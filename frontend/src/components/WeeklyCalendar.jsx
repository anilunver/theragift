import { formatTime } from '../utils/format.js'

const DAY_LABELS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

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

function formatIso(d) {
  return d.toISOString().slice(0, 10)
}

export default function WeeklyCalendar({ weekStart, appointments, onSelectAppointment }) {
  const dates = getWeekDates(weekStart)

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {dates.map((date, idx) => {
        const dateStr = formatIso(date)
        const dayAppointments = appointments
          .filter((a) => a.appointmentDate === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        const isToday = dateStr === formatIso(new Date())

        return (
          <div key={dateStr} className={`bg-white border rounded-2xl p-3 min-h-[160px] shadow-sm ${isToday ? 'border-brand ring-1 ring-brand/30' : 'border-border'}`}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted">{DAY_LABELS[idx]}</div>
                <div className={`text-sm font-extrabold ${isToday ? 'text-brand-light' : 'text-ink'}`}>{date.getDate()}.{date.getMonth() + 1}</div>
              </div>
              {isToday && <span className="text-[10px] font-bold text-brand-light bg-brand-soft px-2 py-0.5 rounded-full">Bugün</span>}
            </div>
            <div className="space-y-1.5">
              {dayAppointments.length === 0 && <div className="text-[11px] text-muted">Randevu yok</div>}
              {dayAppointments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectAppointment(a)}
                  className={`w-full text-left text-[11px] px-2 py-1.5 rounded-lg font-semibold truncate transition-opacity hover:opacity-80 ${
                    a.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500 line-through' : 'bg-brand-soft text-brand-dark'
                  }`}
                >
                  {formatTime(a.startTime)} · {a.clientFullName}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
