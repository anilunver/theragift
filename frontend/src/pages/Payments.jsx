import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios.js'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'
import PaymentUpdateModal from '../components/PaymentUpdateModal.jsx'
import StatCard from '../components/StatCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatCurrency, formatDate, toTitleCase, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format.js'

const TABS = [
  { key: 'all', label: 'Tüm Seanslar', endpoint: '/appointments', empty: 'Henüz randevu kaydı yok.' },
  { key: 'toCollect', label: 'Tahsil Edilecek', endpoint: '/payments/to-collect', empty: 'Tahsil edilecek ödeme yok.' },
  { key: 'overdue', label: 'Geciken', endpoint: '/payments/overdue', empty: 'Geciken ödeme yok.' },
  { key: 'partial', label: 'Kısmi Ödenen', endpoint: '/payments/partial', empty: 'Kısmi ödenen seans yok.' },
  { key: 'paid', label: 'Ödenenler', endpoint: '/payments/paid', empty: 'Henüz ödenmiş seans yok.' },
  { key: 'packageFree', label: 'Paket / Ücretsiz', endpoint: '/payments/package-free', empty: 'Paket veya ücretsiz seans yok.' },
  { key: 'cancelled', label: 'İptal Edilenler', endpoint: '/payments/cancelled', empty: 'İptal edilmiş randevu yok.' },
  { key: 'noShow', label: 'Gelmeyenler', endpoint: '/payments/no-show', empty: 'Gelinmeyen randevu yok.' },
]

const SORT_OPTIONS = [
  { key: 'dateDesc', label: 'En yeni' },
  { key: 'dateAsc', label: 'En eski' },
  { key: 'remainingDesc', label: 'En yüksek borç' },
  { key: 'paidDesc', label: 'En yüksek ödeme' },
]

const EMPTY_FILTERS = {
  search: '',
  dateFrom: '',
  dateTo: '',
  paymentStatus: '',
  paymentMethod: '',
  minFee: '',
  maxFee: '',
}

export default function Payments() {
  const [tab, setTab] = useState('toCollect')
  const [items, setItems] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('dateDesc')
  const [showFilters, setShowFilters] = useState(false)

  const activeTab = TABS.find((t) => t.key === tab)

  const loadTab = () => {
    setLoading(true)
    setError('')
    api.get(activeTab.endpoint)
      .then((res) => setItems(res.data))
      .catch(() => setError('Ödeme verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }

  const loadMonthly = () => {
    api.get('/payments/monthly-summary').then((res) => setMonthly(res.data))
  }

  useEffect(() => { loadTab() }, [tab])
  useEffect(() => { loadMonthly() }, [])

  const handleUpdated = () => {
    loadTab()
    loadMonthly()
  }

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })

  // Filtreler ve sıralama, o an seçili sekmenin verisi ÜZERİNDE uygulanır —
  // yani "Ödenenler" sekmesindeyken arama sadece ödenen kayıtlar içinde yapılır.
  const filteredItems = useMemo(() => {
    let result = items.filter((a) => {
      if (filters.search && !a.clientFullName.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.dateFrom && a.appointmentDate < filters.dateFrom) return false
      if (filters.dateTo && a.appointmentDate > filters.dateTo) return false
      if (filters.paymentStatus && a.paymentStatus !== filters.paymentStatus) return false
      if (filters.paymentMethod && a.paymentMethod !== filters.paymentMethod) return false
      const fee = Number(a.sessionFee || 0)
      if (filters.minFee !== '' && fee < Number(filters.minFee)) return false
      if (filters.maxFee !== '' && fee > Number(filters.maxFee)) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'dateAsc':
          return a.appointmentDate.localeCompare(b.appointmentDate) || a.startTime.localeCompare(b.startTime)
        case 'remainingDesc':
          return Number(b.remainingAmount || 0) - Number(a.remainingAmount || 0)
        case 'paidDesc':
          return Number(b.paidAmount || 0) - Number(a.paidAmount || 0)
        case 'dateDesc':
        default:
          return b.appointmentDate.localeCompare(a.appointmentDate) || b.startTime.localeCompare(a.startTime)
      }
    })

    return result
  }, [items, filters, sort])

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length

  return (
    <div className="space-y-5">
      <PageHeader title="Ödeme Takibi" description="Tüm seansların ödeme durumunu tek yerden yönetin" />

      {monthly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aylık Ciro" value={formatCurrency(monthly.totalRevenue)} tone="positive" />
          <StatCard label="Tahsil Edilen" value={formatCurrency(monthly.totalPaid)} tone="positive" />
          <StatCard label="Tahsil Edilmeyen" value={formatCurrency(monthly.totalUnpaid)} tone="danger" />
          <StatCard label="Toplam Seans" value={monthly.totalAppointments} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.key ? 'bg-brand text-white' : 'bg-white border border-border text-muted hover:bg-panel'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Danışan adı ara..."
            className="border border-border rounded-xl px-3 py-2 text-sm flex-1 min-w-[160px]"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-sm">
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-semibold px-3 py-2 rounded-xl border border-border hover:bg-panel transition-colors"
          >
            Filtreler {activeFilterCount > 0 ? `(${activeFilterCount})` : ''} {showFilters ? '▲' : '▼'}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-semibold text-red-600 hover:underline">
              Filtreleri temizle
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-border">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Tarih başlangıç</label>
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Tarih bitiş</label>
              <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Ödeme durumu</label>
              <select name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
                <option value="">Tümü</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Ödeme yöntemi</label>
              <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
                <option value="">Tümü</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Min ücret (₺)</label>
              <input type="number" name="minFee" value={filters.minFee} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Max ücret (₺)</label>
              <input type="number" name="maxFee" value={filters.maxFee} onChange={handleFilterChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState text="Ödemeler yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : filteredItems.length === 0 ? (
        <EmptyState text={items.length === 0 ? activeTab.empty : 'Filtrelere uyan kayıt bulunamadı.'} icon="💳" />
      ) : (
        <div className="bg-white border border-border rounded-2xl divide-y divide-border shadow-sm">
          {filteredItems.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3.5 flex-wrap gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{toTitleCase(a.clientFullName)}</div>
                <div className="text-xs text-muted">
                  {formatDate(a.appointmentDate)} · Ücret: {formatCurrency(a.sessionFee)} · Ödenen: {formatCurrency(a.paidAmount)} · Kalan: {formatCurrency(a.remainingAmount)}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <PaymentStatusBadge status={a.paymentStatus} />
                <button
                  onClick={() => setSelected(a)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors"
                >
                  Güncelle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PaymentUpdateModal appointment={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  )
}
