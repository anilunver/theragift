import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import StatCard from '../components/StatCard.jsx'
import GiftLicenseCard from '../components/GiftLicenseCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AppointmentModal from '../components/AppointmentModal.jsx'
import AppointmentStatusBadge from '../components/AppointmentStatusBadge.jsx'
import OnboardingChecklist from '../components/OnboardingChecklist.jsx'
import { formatCurrency, formatDate, formatDateTime, formatTime, sessionTypeLabel, todayIsoDate, unavailableBlockTypeLabel } from '../utils/format.js'

const PILOT_BANNER_DISMISSED_KEY = 'theragift_pilot_banner_dismissed'

export default function Dashboard() {
  const [showPilotBanner, setShowPilotBanner] = useState(() => {
    try {
      return localStorage.getItem(PILOT_BANNER_DISMISSED_KEY) !== 'true'
    } catch {
      return true
    }
  })
  const [summary, setSummary] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [weekAppointments, setWeekAppointments] = useState([])
  const [unavailableBlocks, setUnavailableBlocks] = useState([])
  const [monthlyReport, setMonthlyReport] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const loadAll = () => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/subscription/current'),
      api.get('/appointments/week'),
    ])
      .then(([s, sub, week]) => {
        setSummary(s.data)
        setSubscription(sub.data)
        setWeekAppointments(week.data)
      })
      .catch(() => setError('Dashboard verileri yüklenirken bir hata oluştu. Sayfayı yenilemeyi deneyin.'))
      .finally(() => setLoading(false))

    // V2.2B: Çalışma dışı gün/tatil bilgi kartı için bloklar ayrıca yüklenir.
    // Bu isteğin başarısız olması Dashboard'un geri kalanını etkilemez.
    api.get('/unavailable-blocks')
      .then((res) => setUnavailableBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUnavailableBlocks([]))

    // V2.3: "Bu ayın özeti" mini rapor kartı — parametre verilmezse backend
    // varsayılan olarak içinde bulunulan ayı döner (ReportController.resolveRange),
    // bu yüzden Dashboard'u ağırlaştırmadan mevcut Reports endpoint'i yeniden kullanılır.
    // Bu isteğin başarısız olması Dashboard'un geri kalanını etkilemez.
    api.get('/reports/financial')
      .then((res) => setMonthlyReport(res.data))
      .catch(() => setMonthlyReport(null))

    // V2.3: Son işlemler mini kartı — activity log'un son 5 kaydı.
    api.get('/activity-logs', { params: { limit: 5 } })
      .then((res) => setRecentActivity(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRecentActivity([]))
  }

  useEffect(() => { loadAll() }, [])

  const today = todayIsoDate()
  const todayBlock = unavailableBlocks.find((b) => b.startDate <= today && b.endDate >= today)
  const upcomingBlock = !todayBlock
    ? unavailableBlocks
        .filter((b) => b.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    : null

  if (loading) return <LoadingState text="Dashboard yükleniyor..." />
  if (error) return <ErrorState text={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Genel Bakış"
        description="Bugünün özeti ve finans durumu"
        action={
          <>
            <Link
              to="/clients"
              className="border border-border hover:bg-panel text-ink font-semibold px-4 py-2.5 rounded-xl text-sm text-center"
            >
              + Danışan ekle
            </Link>
            <Link
              to="/appointments/new"
              className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm text-center"
            >
              + Yeni randevu
            </Link>
          </>
        }
      />

      {showPilotBanner && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-amber-800">
          <span>🧪 Demo/Pilot ortamındasınız. Veriler test amaçlıdır.</span>
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem(PILOT_BANNER_DISMISSED_KEY, 'true') } 