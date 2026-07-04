import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import WeeklyCalendar from '../components/WeeklyCalendar.jsx'
import AppointmentModal from '../components/AppointmentModal.jsx'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const loadWeek = () => {
    setLoading(true)
    const dateStr = weekStart.toISOString().slice(0, 10)
    api.get('/appointments/week', { params: { weekStart: dateStr } })
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadWeek() }, [weekStart])

  const shiftWeek = (days) => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() + days)
    setWeekStart(newDate)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => shiftWeek(-7)} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold">←</button>
          <div className="text-sm font-semibold text-ink">
            {weekStart.toLocaleDateString('tr-TR')} haftası
          </div>
          <button onClick={() => shiftWeek(7)} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold">→</button>
          <button onClick={() => setWeekStart(getMonday(new Date()))} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold">
            Bugün
          </button>
        </div>
        <Link to="/appointments/new" className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm text-center">
          + Yeni randevu
        </Link>
      </div>

      {loading ? (
        <div className="text-muted">Yükleniyor...</div>
      ) : (
        <WeeklyCalendar weekStart={weekStart} appointments={appointments} onSelectAppointment={setSelected} />
      )}

      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={loadWeek}
        />
      )}
    </div>
  )
}
