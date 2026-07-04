import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios.js'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { markReportsVisited } from '../components/OnboardingChecklist.jsx'
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
  const { showToast } = useToast()
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

  // V2.3.1: Özel tarih aralığında başlangıç bitişten sonraysa, ne backend'e
  // geçersiz bir istek atılır ne de sayfa çöker — kullanıcıya net bir uyarı
  // gösterilir ve tüm rapor sekmeleri (Finans/Randevu/Danışan/İşlem Geçmişi)
  // AYNI ANDA bu uyarıyı görür, çünkü tek bir ortak startDate/endDate state'i
  // kullanılıyor.
  const customRangeInvalid = preset === 'custom' && customStart && customEnd && customStart > customEnd

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
    if (customRangeInvalid) {
      // Geçersiz aralıkta API'ye hiç istek atılmaz — sayfa eski veriyi
      // göstermeye devam etmez, temizlenir ve uyarı bloğu gösterilir.
      setLoading(false)
      setError('')
      setFinancial(null)
      setAppointmentsReport(null)
      setClientsReport([])
      setActivityLogs([])
      return
    }
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

  useEffect(() => { loadAll() }, [startDate, endDate, customRangeInvalid])

  // V2.4: Onboarding checklist'teki "Raporlar sayfasını incele" maddesi bu
  // sayfaya bir kez girildiğinde otomatik tamamlanmış sayılır (sadece
  // localStorage, sunucuya hiçbir şey gönderilmez).
  useEffect(() => { markReportsVisited() }, [])

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

  // V2.3.1: Boş veride CSV indirmek kafa karıştırıcı olabilir (sadece başlık
  // satırı olan bir dosya). Bu durumda dosya indirilmez, kullanıcıya net bir
  // toast ile bilgi verilir.
  const handleExportFinancial = () => {
    if (appointmentsInRange.length === 0) {
      showToast('Bu tarih aralığında dışa aktarılacak finans verisi yok.', 'warning')
      return
    }
    downloadCsv(
      `theragift-finans-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Danışan Adı', 'Tarih', 'Seans Türü', 'Ücret', 'Ödenen', 'Kalan', 'Durum'],
      appointmentsInRange.map((a) => [
        a.clientFullName, formatDate(a.appointmentDate), sessionTypeLabel(a.sessionType),
        formatCurrency(a.sessionFee ?? 0), formatCurrency(a.paidAmount ?? 0), formatCurrency(a.remainingAmount ?? 0),
        appointmentStatusLabel(a.status),
      ])
    )
    showToast('Finans raporu indirildi.')
  }

  const handleExportAppointments = () => {
    if (appointmentsInRange.length === 0) {
      showToast('Bu tarih aralığında dışa aktarılacak randevu verisi yok.', 'warning')
      return
    }
    downloadCsv(
      `theragift-randevu-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Tarih', 'Danışan Adı', 'Seans Türü', 'Durum'],
      appointmentsInRange.map((a) => [
        formatDate(a.appointmentDate), a.clientFullName, sessionTypeLabel(a.sessionType), appointmentStatusLabel(a.status),
      ])
    )
    showToast('Randevu raporu indirildi.')
  }

  const handleExportClients = () => {
    if (filteredClients.length === 0) {
      showToast('Dışa aktarılacak danışan kaydı yok.', 'warning')
      return
    }
    downloadCsv(
      `theragift-danisan-raporu-${periodTagFromDate(startDate)}.csv`,
      ['Danışan Adı', 'Toplam Seans', 'Tamamlanan', 'İptal', 'Gelmedi', 'Tahsil Edilen', 'Kalan Borç', 'Son Randevu', 'Sonraki Randevu', 'Durum'],
      filteredClients.map((c) => [
        c.clientFullName, c.totalSessions, c.completedCount, c.cancelledCount, c.noShowCount,
        formatCurrency(c.collectedAmount ?? 0), formatCurrency(c.remainingAmount ?? 0),
        c.lastAppointmentDate ? formatDate(c.lastAppointmentDate) : '-',
        c.nextAppointmentDate ? formatDate(c.nextAppointmentDate) : '-',
        c.active ? 'Aktif' : 'Pasif',
      ])
    )
    showToast('Danışan raporu indirildi.')
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
                className={`border rounded-lg px-2 py-1.5 text-sm ${customRangeInvalid ? 'border-red-400 bg-red-50' : 'border-border'}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Bitiş</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className={`border rounded-lg px-2 py-1.5 text-sm ${customRangeInvalid ? 'border-red-400 bg-red-50' : 'border-border'}`} />
            </div>
          </div>
        )}
        {customRangeInvalid ? (
          <p className="text-xs font-semibold text-red-600">
            ⚠ Başlangıç tarihi bitiş tarihinden sonra olamaz. Lütfen tarihleri kontrol edin.
          </p>
        ) : (
          <p className="text-xs text-muted">{formatDate(startDate)} – {formatDate(endDate)} aralığı gösteriliyor.</p>
        )}
      </div>

      {customRangeInvalid ? (
        <ErrorState text="Başlangıç tarihi bitiş tarihinden sonra olamaz. Lütfen geçerli bir tarih aralığı seçin." />
      ) : loading ? (
        <LoadingState text="Raporlar yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Dönem Cirosu" value={formatCurrency(financial.totalRevenue)} tone="positive" />
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
                <button
                  type="button"
                  onClick={handleExportFinancial}
                  disabled={appointmentsInRange.length === 0}
                  title={appointmentsInRange.length === 0 ? 'Bu tarih aralığında dışa aktarılacak veri yok' : undefined}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  ⬇ Finans raporunu CSV indir
                </button>
              </div>
              {financial.sessionCount === 0 && financial.cancelledCount === 0 && financial.noShowCount === 0 ? (
                <EmptyState text="Bu dönem için raporlanacak veri bulunamadı. Randevu ve ödeme kayıtları oluştukça raporlar burada görünecek." icon="📊" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Kısmi Ödenen Toplam" value={formatCurrency(financial.partialPaidAmount)} hint="Kısmi ödenmiş seansların kalan tutarı" />
                  <StatCard label="Toplam Seans" value={financial.sessionCount} />
                  <StatCard label="Ücretsiz Seans" value={financial.freeCount} hint="Ciro/tahsilata dahil değil" />
                  <StatCard label="Paketten Düşülen" value={financial.packageCount} hint="Ciro/tahsilata dahil değil" />
                  <StatCard label="İptal Edilen Seans" value={financial.cancelledCount} tone="danger" hint="Ciro/tahsilata dahil değil" />
                  <StatCard label="Gelmeyen Seans" value={financial.noShowCount} tone="danger" hint="Ciro/tahsilata dahil değil" />
                </div>
              )}
            </div>
          )}

          {tab === 'appointments' && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-ink">Randevu Durum Raporu</h3>
                <button
                  type="button"
                  onClick={handleExportAppointments}
                  disabled={appointmentsInRange.length === 0}
                  title={appointmentsInRange.length === 0 ? 'Bu tarih aralığında dışa aktarılacak veri yok' : undefined}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  ⬇ Randevu raporunu CSV indir
                </button>
              </div>
              {appointmentsReport.totalScheduled === 0 ? (
                <EmptyState text="Bu dönem için raporlanacak veri bulunamadı. Randevu ve ödeme kayıtları oluştukça raporlar burada görünecek." icon="🗓️" />
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
                <button
                  type="button"
                  onClick={handleExportClients}
                  disabled={filteredClients.length === 0}
                  title={filteredClients.length === 0 ? 'Dışa aktarılacak danışan kaydı yok' : undefined}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  ⬇ Danışan raporunu CSV indir
                </button>
              </div>

              <p className="text-xs text-muted -mt-2">
                Son ve sonraki randevu bilgileri danışanın genel geçmişinden alınır (seçili tarih aralığından bağımsızdır).
              </p>

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

              {clientsReport.length === 0 ? (
                <EmptyState text="Bu dönem için raporlanacak veri bulunamadı. Randevu ve ödeme kayıtları oluştukça raporlar burada görünecek." icon="👥" />
              ) : filteredClients.length === 0 ? (
                <EmptyState text="Filtrelere uyan danışan bulunamadı. Arama veya filtreleri değişti