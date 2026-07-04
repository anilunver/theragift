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

export default function Payments() {
  const [tab, setTab] = useState('unpaid') // unpaid | overdue
  const [unpaid, setUnpaid] = useState([])
  const [overdue, setOverdue] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const loadAll = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.get('/payments/unpaid'),
      api.get('/payments/overdue'),
      api.get('/payments/monthly-summary'),
    ]).then(([u, o, m]) => {
      setUnpaid(u.data)
      setOverdue(o.data)
      setMonthly(m.data)
    }).catch(() => setError('Ödeme verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const list = tab === 'unpaid' ? unpaid : overdue

  return (
    <div className="space-y-5">
      <PageHeader title="Ödeme Takibi" description="Ödenmemiş ve geciken seans ücretlerini yönetin" />

      {monthly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aylık Ciro" value={formatCurrency(monthly.totalRevenue)} tone="positive" />
          <StatCard label="Tahsil Edilen" value={formatCurrency(monthly.totalPaid)} tone="positive" />
          <StatCard label="Tahsil Edilmeyen" value={formatCurrency(monthly.totalUnpaid)} tone="danger" />
          <StatCard label="Toplam Seans" value={monthly.totalAppointments} />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab('unpaid')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'unpaid' ? 'bg-brand text-white' : 'bg-white border border-border text-muted hover:bg-panel'}`}>
          Ödenmemiş ({unpaid.length})
        </button>
        <button onClick={() => setTab('overdue')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'overdue' ? 'bg-brand text-white' : 'bg-white border border-border text-muted hover:bg-panel'}`}>
          Geciken ({overdue.length})
        </button>
      </div>

      {loading ? (
        <LoadingState text="Ödemeler yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : list.length === 0 ? (
        <EmptyState
          text={tab === 'unpaid' ? 'Ödenmemiş seans yok.' : 'Geciken ödeme yok.'}
          icon={tab === 'unpaid' ? '💳' : '⏰'}
        />
      ) : (
        <div className="bg-white border border-border rounded-2xl divide-y divide-border shadow-sm">
          {list.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3.5 flex-wrap gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{toTitleCase(a.clientFullName)}</div>
                <div className="text-xs text-muted">
                  {formatDate(a.appointmentDate)} · Ücret: {formatCurrency(a.sessionFee)} · Kalan: {formatCurrency(a.remainingAmount)}
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
        <PaymentUpdateModal appointment={selected} onClose={() => setSelected(null)} onUpdated={loadAll} />
      )}
    </div>
  )
}
