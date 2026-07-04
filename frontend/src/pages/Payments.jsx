import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'
import PaymentUpdateModal from '../components/PaymentUpdateModal.jsx'
import StatCard from '../components/StatCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatCurrency, formatDate, toTitleCase } from '../utils/format.js'

const TABS = [
  { key: 'all', label: 'Tüm Seanslar', endpoint: '/appointments', empty: 'Henüz randevu kaydı yok.' },
  { key: 'toCollect', label: 'Tahsil Edilecek', endpoint: '/payments/to-collect', empty: 'Tahsil edilecek ödeme yok.' },
  { key: 'overdue', label: 'Geciken', endpoint: '/payments/overdue', empty: 'Geciken ödeme yok.' },
  { key: 'partial', label: 'Kısmi Ödenen', endpoint: '/payments/partial', empty: 'Kısmi ödenen seans yok.' },
  { key: 'paid', label: 'Ödenenler', endpoint: '/payments/paid', empty: 'Henüz ödenmiş seans yok.' },
  { key: 'packageFree', label: 'Paket / Ücretsiz', endpoint: '/payments/package-free', empty: 'Paket veya ücretsiz seans yok.' },
]

export default function Payments() {
  const [tab, setTab] = useState('toCollect')
  const [items, setItems] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

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

      {loading ? (
        <LoadingState text="Ödemeler yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : items.length === 0 ? (
        <EmptyState text={activeTab.empty} icon="💳" />
      ) : (
        <div className="bg-white border border-border rounded-2xl divide-y divide-border shadow-sm">
          {items.map((a) => (
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
