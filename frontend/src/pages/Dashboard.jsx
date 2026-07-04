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
import { formatCurrency, formatDate, formatTime, sessionTypeLabel } from '../utils/format.js'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [weekAppointments, setWeekAppointments] = useState([])
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
  }

  useEffect(() => { loadAll() }, [])

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugünkü Seans" value={summary.todayAppointmentsCount} hint="Planlanan randevu sayısı" />
        <StatCard label="Boş Slot" value={summary.availableSlotsCount} hint="Bugün için uygun saat" />
        <StatCard label="Bekleyen Form" value={summary.pendingFormsCount} hint="Yanıt bekleyen uygunluk formu" />
        <StatCard label="Bugünkü Tahsilat" value={formatCurrency(summary.todayRevenue)} tone="positive" hint="Bugün tahsil edilen tutar" />
        <StatCard label="Bekleyen Ödeme" value={formatCurrency(summary.unpaidAmount)} tone="warning" hint="Toplam tahsil edilmemiş tutar" />
        <StatCard label="Geciken Ödeme" value={summary.overduePaymentsCount} tone="danger" hint="Vadesi geçmiş seans sayısı" />
        <StatCard label="Aylık Ciro" value={formatCurrency(summary.monthlyRevenue)} tone="positive" hint="Bu ayki toplam ücretlendirme" />
        <StatCard label="AI Kotası" value={`${summary.aiQuotaUsed} / ${summary.aiQuotaLimit}`} hint="Kullanılan / toplam hak" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-ink">Bu Haftaki Randevular</h3>
            <Link to="/calendar" className="text-sm font-semibold text-brand-light hover:underline">Takvime git →</Link>
          </div>
          {weekAppointments.length === 0 ? (
            <EmptyState text="Bu hafta için planlanmış randevu yok." icon="📅" />
          ) : (
            <div className="space-y-2">
              {weekAppointments.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3 hover:bg-panel transition-colors text-left"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-ink truncate">{a.clientFullName}</div>
                    <div className="text-xs text-muted">{formatDate(a.appointmentDate)} · {formatTime(a.startTime)} - {formatTime(a.endTime)}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-soft text-brand-dark shrink-0 ml-3">
                    {sessionTypeLabel(a.sessionType)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <GiftLicenseCard subscription={subscription} />
      </div>

      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={loadAll}
        />
      )}
    </div>
  )
}
