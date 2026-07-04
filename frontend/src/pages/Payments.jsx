import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'
import PaymentUpdateModal from '../components/PaymentUpdateModal.jsx'
import StatCard from '../components/StatCard.jsx'

export default function Payments() {
  const [tab, setTab] = useState('unpaid') // unpaid | overdue
  const [unpaid, setUnpaid] = useState([])
  const [overdue, setOverdue] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/payments/unpaid'),
      api.get('/payments/overdue'),
      api.get('/payments/monthly-summary'),
    ]).then(([u, o, m]) => {
      setUnpaid(u.data)
      setOverdue(o.data)
      setMonthly(m.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const list = tab === 'unpaid' ? unpaid : overdue

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-ink">Ödeme Takibi</h2>
        <p className="text-sm text-muted">Ödenmemiş ve geciken seans ücretlerini yönetin</p>
      </div>

      {monthly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aylık Ciro" value={`₺${monthly.totalRevenue}`} tone="positive" />
          <StatCard label="Tahsil Edilen" value={`₺${monthly.totalPaid}`} tone="positive" />
          <StatCard label="Tahsil Edilmeyen" value={`₺${monthly.totalUnpaid}`} tone="danger" />
          <StatCard label="Toplam Seans" value={monthly.totalAppointments} />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab('unpaid')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'unpaid' ? 'bg-brand text-white' : 'bg-white border border-border text-muted'}`}>
          Ödenmemiş ({unpaid.length})
        </button>
        <button onClick={() => setTab('overdue')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'overdue' ? 'bg-brand text-white' : 'bg-white border border-border text-muted'}`}>
          Geciken ({overdue.length})
        </button>
      </div>

      {loading ? (
        <div className="text-muted">Yükleniyor...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-muted bg-white border border-border rounded-2xl p-6 text-center">
          Bu listede kayıt yok.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl divide-y divide-border">
          {list.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 flex-wrap gap-2">
              <div>
                <div className="text-sm font-semibold text-ink">{a.clientFullName}</div>
                <div className="text-xs text-muted">{a.appointmentDate} · Ücret: ₺{a.sessionFee} · Kalan: ₺{a.remainingAmount}</div>
              </div>
              <div className="flex items-center gap-3">
                <PaymentStatusBadge status={a.paymentStatus} />
                <button
                  onClick={() => setSelected(a)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel"
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
