import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios.js'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import {
  formatCurrency, formatDate, formatDateTime, toIsoDateString,
  appointmentStatusLabel, sessionTypeLabel,
} from '../utils/format.js'
import { downloadCsv, periodTagFromDate } from '../utils/csv.js'

// V2.3: Raporlar sayfası. Sadece OKUMA amaçlı — mevcut hiçbir hesaplama
// mantığına (ödeme/randevu/öneri/sabit randevu) dokunmaz, sadece
// /api/reports/* ve /api/activity-logs uçlarından zaten hesaplanmış veriyi
// gösterir ve CSV olarak dışa aktarır (CSV frontend'de üretilir, backend'de
// ayrı bir export endpoint'i yoktur).

const RANGE_PRESETS = [
  { key: 'thisMonth', label: 'Bu ay' },
  { key: 'lastMonth', label: 'Geçen ay' },
  { key: 'last30', label: 'Son 30 gün' },
  { key: 'custom', label: 'Özel tarih aralığı' },
]

const TABS = [
  { key: 'financial', label: 'Finans' },
  { key: 'appointments', label: 'Randevular' },
  { key: 'clients', label: 'Danışanlar' },
  { key: 'activity', label: 'İşlem Geçmişi' },
]

function firstDayOfMonth(offsetMonths = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return d
}

function lastDayOfMonth(offsetMonths = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths + 1)
  d.setDate(0)
  return d
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export default function Reports() {
  const [preset, setPreset] = useState('thisMonth')
  const [customStart, setCustomStart] = useState(toIsoDateString(firstDayOfMonth()))
  const [customEnd, setCustomEnd] = useState(toIsoDateString(new Date()))
  const [tab, setTab] = useState('financial')

  const [financial, setFinancial] = useState(null)
  const [appointmentsReport, setAppointmentsReport] = useState(null)
  const [clientsReport, setClientsReport] = useState([])
  const [allAppointments, setAllAppointments] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [clientSearch, setClientSearch] = useState('')
  const [clientStatusFilter, setClientStatusFilter] = useState('ALL')
  const [clientDebtOnly, setClientDebtOnly] = useState(false)

  const { startDate, endDate } = useMemo(() => {
    if (preset === 'lastMonth') {
      return { startDate: toIsoDateString(firstDayOfMonth(-1)), endDate: toIsoDateString(lastDayOfMonth(-1)) }
    }
    if (preset === 'last30') {
      return { startDate: toIsoDateString(daysAgo(29)), endDate: toIsoDateString(new Date()) }
    }
    if (preset === 'custom') {
      return { startDate: customStart, endDate: customEnd }
    }
    // thisMonth (varsayılan)
    return { startDate: toIsoDateString(firstDayOfMonth()), endDate: toIsoDateString(lastDayOfMonth()) }
  }, [preset, customStart, customEnd])

  const loadAll = () => {
    setLoading(true)
    setError('')
    const params = { startDate, endDate }
    Promise.all([
      api.get('/reports/financial', { params }),
      api.get('/reports/appointments', { params }),
      api.get('/reports/clients', { params }),
      api.get('/appointments'),
      api.get('/activity-logs', { params }),
    ])
      .then(([fin, appt, clients, allAppts, logs]) => {
        setFinancial(fin.data)
        setAppointmentsReport(appt.data)
        setClientsReport(Array.isArray(clients.data) ? clients.data : [])
        setAllAppointments(Array.isArray(allAppts.data) ? allAppts.data : [])
        setActivityLogs(Array.isArray(logs.data) ? logs.data : [])
      })
      .catch(() => setError('Rapor verileri alınamadı.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [startDate, endDate])

  // Finans/Randevu CSV'leri için: seçili tarih aralığındaki randevu satırları.
  // Ayrı bir backend export endpoint'i açmak yerine zaten çekilmiş /appointments
  // listesi tarih aralığına göre frontend'de filtrelenir.
  const appointmentsInRange = useMemo(
    () => allAppointments.filter((a) => a.appointmentDate >= startDate && a.appointmentDate <= endDate),
    [allAppointments, startDate, endDate]
  )

  const filteredClients = useMemo(() => {
    return clientsReport.filter((c) => {
      if (clientSearch && !c.clientFullName.toLowerCase().includes(clientSearch.toLowerCase())) return false
      if (clientStatusFilter === 'ACTIVE' && !c.active) return false
      if (clientStatusFilter === 'INACTIVE' && c.active) return false
      if (clientDebtOnly && Number(c.remainingAmount || 0) <= 0) return false
      return true
    })
  }, [clientsReport, clientSearch, clientStatusFilter, clientDebtOnly])

  const handleExportFinancial = () => {
    downloadCsv(
      `theragift-finans-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Danışan Adı', 'Tarih', 'Seans Türü', 'Ücret', 'Ödenen', 'Kalan', 'Durum'],
      appointmentsInRange.map((a) => [
        a.clientFullName, formatDate(a.appointmentDate), sessionTypeLabel(a.sessionType),
        a.sessionFee ?? 0, a.paidAmount ?? 0, a.remainingAmount ?? 0, appointmentStatusLabel(a.status),
      ])
    )
  }

  const handleExportAppointments = () => {
    downloadCsv(
      `theragift-randevu-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Tarih', 'Danışan Adı', 'Seans Türü', 'Durum'],
      appointmentsInRange.map((a) => [
        formatDate(a.appointmentDate), a.clientFullName, sessionTypeLabel(a.sessionType), appointmentStatusLabel(a.status),
      ])
    )
  }

  const handleExportClients = () => {
    downloadCsv(
      `theragift-danisan-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Danışan Adı', 'Toplam Seans', 'Tamamlanan', 'İptal', 'Gelmedi', 'Tahsil Edilen', 'Kalan Borç', 'Son Randevu', 'Sonraki Randevu', 'Durum'],
      filteredClients.map((c) => [
        c.clientFullName, c.totalSessions, c.completedCount, c.cancelledCount, c.noShowCount,
        c.collectedAmount ?? 0, c.remainingAmount ?? 0,
        c.lastAppointmentDate ? formatDate(c.lastAppointmentDate) : '-',
        c.nextAppointmentDate ? formatDate(c.nextAppointmentDate) : '-',
        c.active ? 'Aktif' : 'Pasif',
      ])
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Raporlar" description="Randevu, ödeme ve danışan verilerinizi özetleyin." />

      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${preset === p.key ? 'bg-brand text-white shadow-sm' : 'bg-panel text-muted hover:bg-border/40'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Başlangıç</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Bitiş</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>
        )}
        <p className="text-xs text-muted">{formatDate(startDate)} – {formatDate(endDate)} aralığı gösteriliyor.</p>
      </div>

      {loading ? (
        <LoadingState text="Raporlar yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam Ciro" value={formatCurrency(financial.totalRevenue)} tone="positive" />
            <StatCard label="Tahsil Edilen" value={formatCurrency(financial.collectedAmount)} tone="positive" />
            <StatCard label="Tahsil Edilmeyen" value={formatCurrency(financial.outstandingAmount)} tone="warning" />
            <StatCard label="Geciken Ödeme" value={formatCurrency(financial.overdueAmount)} tone="danger" />
          </div>

          <div className="flex gap-1.5 flex-wrap bg-panel/60 border border-border rounded-2xl p-1.5">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.key ? 'bg-brand text-white shadow-sm' : 'bg-white text-muted hover:bg-panel border border-transparent'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'financial' && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-ink">Finans Özeti</h3>
                <button type="button" onClick={handleExportFinancial}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors">
                  ⬇ Finans raporunu CSV indir
                </button>
              </div>
              {financial.sessionCount === 0 && financial.cancelledCount === 0 && financial.noShowCount === 0 ? (
                <EmptyState text="Bu tarih aralığında raporlanacak veri bulunamadı." icon="📊" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Kısmi Ödenen Toplam" value={formatCurrency(financial.partialPaidAmount)} />
                  <StatCard label="Toplam Seans" value={financial.sessionCount} />
                  <StatCard label="Ücretsiz Seans" value={financial.freeCount} />
                  <StatCard label="Paketten Düşülen" value={financial.packageCount} />
                  <StatCard label="İptal Edilen" value={financial.cancelledCount} tone="danger" />
                  <StatCard label="Gelmeyen" value={financial.noShowCount} tone="danger" />
                </div>
              )}
            </div>
          )}

          {tab === 'appointments' && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-ink">Randevu Durum Raporu</h3>
                <button type="button" onClick={handleExportAppointments}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors">
                  ⬇ Randevu raporunu CSV indir
                </button>
              </div>
              {appointmentsReport.totalScheduled === 0 ? (
                <EmptyState text="Bu tarih aralığında raporlanacak veri bulunamadı." icon="🗓️" />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Toplam Planlanan" value={appointmentsReport.totalScheduled} />
                    <StatCard label="Tamamlanan" value={appointmentsReport.completedCount} tone="positive" />
                    <StatCard label="İptal Edilen" value={appointmentsReport.cancelledCount} tone="danger" />
                    <StatCard label="Gelmeyen" value={appointmentsReport.noShowCount} tone="danger" />
                    <StatCard label="Online Seans" value={appointmentsReport.onlineCount} />
                    <StatCard label="Yüz Yüze Seans" value={appointmentsReport.faceToFaceCount} />
                    <StatCard label="En Yoğun Gün" value={appointmentsReport.busiestDayOfWeek || '-'} />
                    <StatCard label="En Yoğun Saat" value={appointmentsReport.busiestHourRange || '-'} />
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'clients' && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-ink">Danışan Bazlı Özet</h3>
                <button type="button" onClick={handleExportClients}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors">
                  ⬇ Danışan raporunu CSV indir
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Danışan adı ara..."
                  className="border border-border rounded-xl px-3 py-2 text-sm flex-1 min-w-[160px]"
                />
                <select value={clientStatusFilter} onChange={(e) => setClientStatusFilter(e.target.value)}
                  className="border border-border rounded-xl px-3 py-2 text-sm">
                  <option value="ALL">Tümü</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Pasif</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink px-2">
                  <input type="checkbox" checked={clientDebtOnly} onChange={(e) => setClientDebtOnly(e.target.checked)} />
                  Sadece borcu olanlar
                </label>
              </div>

              {filteredClients.length === 0 ? (
                <EmptyState text="Bu tarih aralığında raporlanacak veri bulunamadı." icon="👥" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted border-b border-border bg-panel/60">
                        <th className="px-3 py-2 font-semibold">Danışan</th>
                        <th className="px-3 py-2 font-semibold text-center">Toplam</th>
                        <th className="px-3 py-2 font-semibold text-center">Tamamlanan</th>
                        <th className="px-3 py-2 font-semibold text-center">İptal</th>
                        <th className="px-3 py-2 font-semibold text-center">Gelmedi</th>
                        <th className="px-3 py-2 font-semibold text-right">Tahsil Edilen</th>
                        <th className="px-3 py-2 font-semibold text-right">Kalan Borç</th>
                        <th className="px-3 py-2 font-semibold">Son Randevu</th>
                        <th className="px-3 py-2 font-semibold">Sonraki Randevu</th>
                        <th className="px-3 py-2 font-semibold">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => (
                        <tr key={c.clientId} className="border-b border-border last:border-0 hover:bg-panel transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-ink">{c.clientFullName}</td>
                          <td className="px-3 py-2.5 text-center">{c.totalSessions}</td>
                          <td className="px-3 py-2.5 text-center">{c.completedCount}</td>
                          <td className="px-3 py-2.5 text-center">{c.cancelledCount}</td>
                          <td className="px-3 py-2.5 text-center">{c.noShowCount}</td>
                          <td className="px-3 py-2.5 text-right text-green-700 font-semibold">{formatCurrency(c.collectedAmount)}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${Number(c.remainingAmount) > 0 ? 'text-red-600' : 'text-ink'}`}>{formatCurrency(c.remainingAmount)}</td>
                          <td className="px-3 py-2.5 text-muted">{c.lastAppointmentDate ? formatDate(c.lastAppointmentDate) : '-'}</td>
                          <td className="px-3 py-2.5 text-muted">{c.nextAppointmentDate ? formatDate(c.nextAppointmentDate) : '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {c.active ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-extrabold text-ink">İşlem Geçmişi</h3>
              <p className="text-xs text-muted -mt-2">
                Bu liste operasyonel işlemleri özetler; danışan not içeriği veya klinik detay göstermez.
              </p>
              {activityLogs.length === 0 ? (
                <EmptyState text="Bu tarih aralığında raporlanacak veri bulunamadı." icon="🕓" />
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-3 border border-border rounded-xl px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink">{log.title}</div>
                        {log.description && <div className="text-xs text-muted mt-0.5">{log.description}</div>}
                      </div>
                      <div className="text-[11px] text-muted shrink-0">{formatDateTime(log.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
