import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import WeeklyCalendar from '../components/WeeklyCalendar.jsx'
import AppointmentModal from '../components/AppointmentModal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { toIsoDateString } from '../utils/format.js'

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
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const loadWeek = () => {
    setLoading(true)
    setError('')
    // Local tarih kullanılır — toISOString() UTC'ye çevirdiği için gün kaymasına yol açar.
    const dateStr = toIsoDateString(weekStart)
    api.get('/appointments/week', { params: { weekStart: dateStr } })
      .then((res) => setAppointments(res.data))
      .catch(() => setError('Randevular yüklenemedi.'))
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
      <PageHeader
        title="Haftalık Takvim"
        description={`${weekStart.toLocaleDateString('tr-TR')} haftası`}
        action={
          <Link to="/appointments/new" className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm text-center whitespace-nowrap">
            + Yeni randevu
          </Link>
        }
      />

      <div className="flex items-center gap-2">
        <button onClick={() => shiftWeek(-7)} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-panel transition-colors">← Önceki</button>
        <button onClick={() => setWeekStart(getMonday(new Date()))} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-panel transition-colors">
          Bugün
        </button>
        <button onClick={() => shiftWeek(7)} className="px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-panel transition-colors">Sonraki →</button>
      </div>

      {loading ? (
        <LoadingState text="Takvim yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
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
