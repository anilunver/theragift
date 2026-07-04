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
import { formatCurrency, formatDate, formatDateTime, formatTime, sessionTypeLabel, todayIsoDate, unavailableBlockTypeLabel } from '../utils/format.js'

export default function Dashboard() {
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

      {todayBlock && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700">
          🚫 Bugün {unavailableBlockTypeLabel(todayBlock.type, todayBlock.title)} olarak işaretlendi.
        </div>
      )}
      {!todayBlock && upcomingBlock && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 text-sm font-semibold text-purple-800">
          📅 Yaklaşan çalışma dışı dönem: {formatDate(upcomingBlock.startDate)} - {formatDate(upcomingBlock.endDate)}
          {' '}({unavailableBlockTypeLabel(upcomingBlock.type, upcomingBlock.title)})
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-muted mb-3">Bugün ne var?</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bugünkü Seans" value={summary.todayAppointmentsCount} hint="Planlanan randevu sayısı" />
          <StatCard label="Boş Slot" value={summary.availableSlotsCount} hint="Bugün için uygun saat" />
          <StatCard label="Bugünkü Tahsilat" value={formatCurrency(summary.todayRevenue)} tone="positive" hint="Bugün tahsil edilen tutar" />
          <StatCard label="Bekleyen Form" value={summary.pendingFormsCount} hint="Yanıt bekleyen uygunluk formu" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-muted mb-3">Finansal Durum</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bekleyen Ödeme" value={formatCurrency(summary.unpaidAmount)} tone="warning" hint="Toplam tahsil edilmemiş tutar" />
          <StatCard label="Geciken Ödeme" value={summary.overduePaymentsCount} tone="danger" hint="Vadesi geçmiş seans sayısı" />
          <StatCard label="Aylık Ciro" value={formatCurrency(summary.monthlyRevenue)} tone="positive" hint="Bu ayki toplam ücretlendirme" />
          <StatCard label="AI Kotası" value={`${summary.aiQuotaUsed} / ${summary.aiQuotaLimit}`} hint="Kullanılan / toplam hak" />
        </div>
      </div>

      {monthlyReport && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-muted">Bu Ayın Özeti</h3>
            <Link to="/reports" className="text-xs font-semibold text-brand-light hover:underline">Raporlara git →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Tamamlanan Seans" value={monthlyReport.sessionCount} hint="Bu ay tamamlanan/ücretlendirilen seans" />
            <StatCard label="Tahsil Edilen" value={formatCurrency(monthlyReport.collectedAmount)} tone="positive" hint="Bu ay tahsil edilen tutar" />
            <StatCard label="Kalan Borç" value={formatCurrency(monthlyReport.outstandingAmount)} tone="warning" hint="Bu ay tahsil edilmeyen tutar" />
            <StatCard label="İptal / Gelmedi" value={monthlyReport.cancelledCount + monthlyReport.noShowCount} tone="danger" hint="Bu ay iptal edilen + gelinmeyen seans" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-ink">Bu Haftaki Randevular</h3>
              <p className="text-xs text-muted mt-0.5">Bir satıra tıklayarak randevu detayını açabilirsiniz.</p>
            </div>
            <Link to="/calendar" className="text-sm font-semibold text-brand-light hover:underline shrink-0 ml-3">Takvime git →</Link>
          </div>
          {weekAppointments.length === 0 ? (
            <EmptyState text="Bu hafta için planlanmış randevu yok. Yeni bir randevu oluşturarak başlayabilirsiniz." icon="📅" />
          ) : (
            <div className="space-y-2">
              {weekAppointments.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a)}
                  className="w-full flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3 hover:bg-panel hover:border-brand-light/40 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-ink truncate">{a.clientFullName}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {formatDate(a.appointmentDate)} <span className="text-border">·</span> {formatTime(a.startTime)}–{formatTime(a.endTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-soft text-brand-dark">
                      {sessionTypeLabel(a.sessionType)}
                    </span>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <GiftLicenseCard subscription={subscription} />

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-ink text-sm">Son İşlemler</h3>
              <Link to="/reports" className="text-xs font-semibold text-brand-light hover:underline">Tümü →</Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-3">
                <div className="text-lg mb-1">🕓</div>
                <p className="text-xs text-muted">Henüz kayıtlı işlem yok.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.map((log) => (
                  <div key={log.id} className="text-xs min-w-0">
                    <div className="font-semibold text-ink truncate" title={log.title}>{log.title}</div>
                    <div className="text-muted mt-0.5">{formatDateTime(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
