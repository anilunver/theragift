import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.js'
import ClientDetailCard from '../components/ClientDetailCard.jsx'
import ClientEditModal from '../components/ClientEditModal.jsx'
import RecurringAppointmentSection from '../components/RecurringAppointmentSection.jsx'
import ClientNotesSection from '../components/ClientNotesSection.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatCurrency, formatDate } from '../utils/format.js'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  const loadClient = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/payment-summary`),
    ])
      .then(([c, p]) => {
        setClient(c.data)
        setPaymentSummary(p.data)
      })
      .catch(() => setError('Danışan bilgileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadClient() }, [id])

  if (loading) return <LoadingState text="Danışan bilgileri yükleniyor..." />
  if (error) return <ErrorState text={error} />
  if (!client) return <ErrorState text="Danışan bulunamadı." />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/clients')} className="text-sm font-semibold text-muted hover:text-ink transition-colors">
          ← Danışanlara dön
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="border border-border hover:bg-panel text-ink font-semibold px-4 py-2.5 rounded-xl text-sm"
          >
            Danışanı Düzenle
          </button>
          <Link
            to="/appointments/new"
            state={{ clientId: client.id }}
            className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm"
          >
            + Randevu Oluştur
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ClientDetailCard client={client} />
          <ClientNotesSection client={client} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-ink mb-4">Ödeme Özeti</h3>
            {paymentSummary && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-panel rounded-xl p-3 text-center">
                    <div className="text-xs text-muted">Toplam Ücret</div>
                    <div className="font-extrabold text-ink">{formatCurrency(paymentSummary.totalFeeCharged)}</div>
                  </div>
                  <div className="bg-panel rounded-xl p-3 text-center">
                    <div className="text-xs text-muted">Ödenen</div>
                    <div className="font-extrabold text-brand-light">{formatCurrency(paymentSummary.totalPaid)}</div>
                  </div>
                  <div className="bg-panel rounded-xl p-3 text-center">
                    <div className="text-xs text-muted">Kalan Borç</div>
                    <div className="font-extrabold text-red-600">{formatCurrency(paymentSummary.totalRemaining)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {paymentSummary.appointments.length === 0 ? (
                    <EmptyState text="Bu danışan için henüz randevu kaydı yok." icon="🗓️" />
                  ) : paymentSummary.appointments.map((a) => (
                    <div key={a.appointmentId} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 flex-wrap gap-2">
                      <div>
                        <div className="text-sm font-semibold text-ink">{formatDate(a.appointmentDate)}</div>
                        <div className="text-xs text-muted">
                          Ücret: {formatCurrency(a.sessionFee)} · Ödenen: {formatCurrency(a.paidAmount)} · Kalan: {formatCurrency(a.remainingAmount)}
                        </div>
                      </div>
                      <PaymentStatusBadge status={a.paymentStatus} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* V2.2A.2: "Önümüzdeki 4 hafta" akışında beklenmeyen bir hata olursa
              tüm danışan detay sayfası değil, sadece bu kart çökmeli. */}
          <ErrorBoundary>
            <RecurringAppointmentSection client={client} />
          </ErrorBoundary>
        </div>
      </div>

      {showEdit && (
        <ClientEditModal client={client} onClose={() => setShowEdit(false)} onUpdated={loadClient} />
      )}
    </div>
  )
}
