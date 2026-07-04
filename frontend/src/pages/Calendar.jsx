import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api/axios.js'
import WeeklyCalendar from '../components/WeeklyCalendar.jsx'
import AppointmentModal from '../components/AppointmentModal.jsx'
import UnavailableBlockFormModal from '../components/UnavailableBlockFormModal.jsx'
import UnavailableBlockDetailModal from '../components/UnavailableBlockDetailModal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { toIsoDateString, parseLocalDate } from '../utils/format.js'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Calendar() {
  const location = useLocation()
  // V2.2C: "Takvimde kontrol et" (blok çakışma modalından) belirli bir haftaya
  // yönlendirebilir — location.state.targetDate varsa o haftanın Pazartesi'sine gidilir.
  const initialWeekStart = location.state?.targetDate
    ? getMonday(parseLocalDate(location.state.targetDate) || new Date())
    : getMonday(new Date())
  const [weekStart, setWeekStart] = useState(initialWeekStart)
  const [appointments, setAppointments] = useState([])
  const [unavailableBlocks, setUnavailableBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [quickCloseDate, setQuickCloseDate] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)

  const loadWeek = () => {
    setLoading(true)
    setError('')
    // Local tarih kullanılır — toISOString() UTC'ye çevirdiği için gün kaymasına yol açar.
    const dateStr = toIsoDateString(weekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = toIsoDateString(weekEnd)

    api.get('/appointments/week', { params: { weekStart: dateStr } })
      .then((res) => setAppointments(res.data))
      .catch(() => setError('Randevular yüklenemedi.'))
      .finally(() => setLoading(false))

    // V2.2B: Bu haftaya denk gelen çalışma dışı gün/tatil bloklarını da yükle.
    // Bu isteğin başarısız olması takvimi çökertmemeli, sadece badge'ler görünmez.
    api.get('/unavailable-blocks/range', { params: { startDate: dateStr, endDate: weekEndStr } })
      .then((res) => setUnavailableBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUnavailableBlocks([]))
  }

  useEffect(() => { loadWeek() }, [weekStart])

  const shiftWeek = (days) => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() + days)
    setWeekStart(newDate)
  }

  return (
    <div className="space-y-5">
      <PageHeade