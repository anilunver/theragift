import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.js'
import ClientDetailCard from '../components/ClientDetailCard.jsx'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/payment-summary`),
    ])
      .then(([c, p]) => {
        setClient(c.data)
        setPaymentSummary(p.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-muted">Yükleniyor...</div>
  if (!client) return <div className="text-red-600">Danışan bulunamadı.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/clients')} className="text-sm font-semibold text-muted hover:text-ink">
          ← Danışanlara dön
        </button>
        <Link
          to="/appointments/new"
          state={{ clientId: client.id }}
          className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm"
        >
          + Randevu Oluştur
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ClientDetailCard client={client} />
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <h3 className="font-extrabold text-ink mb-4">Ödeme Özeti</h3>
          {paymentSummary && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-panel rounded-xl p-3 text-center">
                  <div className="text-xs text-muted">Toplam Ücret</div>
                  <div className="font-extrabold text-ink">₺{paymentSummary.totalFeeCharged}</div>
                </div>
                <div className="bg-panel rounded-xl p-3 text-center">
                  <div className="text-xs text-muted">Ödenen</div>
                  <div className="font-extrabold text-brand-light">₺{paymentSummary.totalPaid}</div>
                </div>
                <div className="bg-panel rounded-xl p-3 text-center">
                  <div className="text-xs text-muted">Kalan Borç</div>
                  <div className="font-extrabold text-red-600">₺{paymentSummary.totalRemaining}</div>
                </div>
              </div>

              <div className="space-y-2">
                {paymentSummary.appointments.length === 0 ? (
                  <div className="text-sm text-muted text-center py-6">Henüz randevu kaydı yok.</div>
                ) : paymentSummary.appointments.map((a) => (
                  <div key={a.appointmentId} className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-ink">{a.appointmentDate}</div>
                      <div className="text-xs text-muted">Ücret: ₺{a.sessionFee} · Ödenen: ₺{a.paidAmount} · Kalan: ₺{a.remainingAmount}</div>
                    </div>
                    <PaymentStatusBadge status={a.paymentStatus} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
