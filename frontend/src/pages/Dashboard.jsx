import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import StatCard from '../components/StatCard.jsx'
import GiftLicenseCard from '../components/GiftLicenseCard.jsx'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [weekAppointments, setWeekAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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
      .catch(() => setError('Dashboard verileri yüklenirken hata oluştu.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-muted">Yükleniyor...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Genel Bakış</h2>
          <p className="text-sm text-muted">Bugünün özeti ve finans durumu</p>
        </div>
        <Link
          to="/appointments/new"
          className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm text-center"
        >
          + Yeni randevu
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugünkü Seans" value={summary.todayAppointmentsCount} />
        <StatCard label="Boş Slot" value={summary.availableSlotsCount} />
        <StatCard label="Bekleyen Form" value={summary.pendingFormsCount} />
        <StatCard label="Bugünkü Tahsilat" value={`₺${summary.todayRevenue}`} tone="positive" />
        <StatCard label="Bekleyen Ödeme" value={`₺${summary.unpaidAmount}`} tone="warning" />
        <StatCard label="Geciken Ödeme" value={summary.overduePaymentsCount} tone="danger" />
        <StatCard label="Aylık Ciro" value={`₺${summary.monthlyRevenue}`} tone="positive" />
        <StatCard label="AI Kotası" value={`${summary.aiQuotaUsed}/${summary.aiQuotaLimit}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-ink">Bu Haftaki Randevular</h3>
            <Link to="/calendar" className="text-sm font-semibold text-brand-light hover:underline">Takvime git →</Link>
          </div>
          {weekAppointments.length === 0 ? (
            <div className="text-sm text-muted py-8 text-center">Bu hafta için planlanmış randevu yok.</div>
          ) : (
            <div className="space-y-2">
              {weekAppointments.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                  <div>
                    <div className="font-semibold text-sm text-ink">{a.clientFullName}</div>
                    <div className="text-xs text-muted">{a.appointmentDate} · {a.startTime} - {a.endTime}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-soft text-brand-dark">
                    {a.sessionType === 'ONLINE' ? 'Online' : 'Yüz Yüze'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <GiftLicenseCard subscription={subscription} />
      </div>
    </div>
  )
}
