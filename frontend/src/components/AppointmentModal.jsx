import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import PaymentStatusBadge from './PaymentStatusBadge.jsx'
import AppointmentStatusBadge from './AppointmentStatusBadge.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency, formatDate, formatTime, sessionTypeLabel } from '../utils/format.js'

export default function AppointmentModal({ appointment, onClose, onUpdated }) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState(appointment.status)
  const [saving, setSaving] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const handleStatusChange = async (newStatus, message) => {
    setSaving(true)
    try {
      await api.put(`/appointments/${appointment.id}`, { status: newStatus })
      setStatus(newStatus)
      onUpdated()
      showToast(message)
    } catch (err) {
      showToast(err.response?.data?.message || 'Randevu güncellenemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    setSaving(true)
    try {
      await api.delete(`/appointments/${appointment.id}`)
      onUpdated()
      showToast('Randevu iptal edildi.')
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message || 'Randevu iptal edilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between mb-4 gap-3">
          <h3 className="font-extrabold text-lg text-ink">{appointment.clientFullName}</h3>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <AppointmentStatusBadge status={status} />
            <PaymentStatusBadge status={appointment.paymentStatus} />
          </div>
        </div>

        {appointment.outOfWorkingHours && (
          <div className="text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">
            Bu randevu psikoloğun tanımlı mesai saatleri dışında oluşturulmuş.
          </div>
        )}

        <div className="space-y-2 text-sm mb-5 bg-panel rounded-xl p-3">
          <div className="flex justify-between"><span className="text-muted">Tarih</span> <strong>{formatDate(appointment.appointmentDate)}</strong></div>
          <div className="flex justify-between"><span className="text-muted">Saat</span> <strong>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</strong></div>
          <div className="flex justify-between"><span className="text-muted">Tür</span> <strong>{sessionTypeLabel(appointment.sessionType)}</strong></div>
          <div className="flex justify-between"><span className="text-muted">Ücret</span> <strong>{formatCurrency(appointment.sessionFee)}</strong></div>
          {appointment.notes && (
            <div className="pt-1 border-t border-border/70">
              <span className="text-muted">Not:</span> {appointment.notes}
            </div>
          )}
        </div>

        {appointment.clientId && (
          <button
            onClick={() => navigate(`/clients/${appointment.clientId}`)}
            className="text-xs font-semibold text-brand-light hover:underline mb-4"
          >
            Danışan detayına git →
          </button>
        )}

        {status !== 'CANCELLED' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button disabled={saving} onClick={() => handleStatusChange('COMPLETED', 'Randevu tamamlandı olarak işaretlendi.')}
              className="text-xs font-bold py-2 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 transition-colors">
              ✓ Tamamlandı
            </button>
            <button disabled={saving} onClick={() => handleStatusChange('NO_SHOW', 'Randevu gelmedi olarak işaretlendi.')}
              className="text-xs font-bold py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors">
              ✕ Gelmedi
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel transition-colors">
            Kapat
          </button>
          {status !== 'CANCELLED' && !confirmingCancel && (
            <button onClick={() => setConfirmingCancel(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-sm transition-colors">
              Randevuyu İptal Et
            </button>
          )}
          {confirmingCancel && (
            <button disabled={saving} onClick={handleCancel}
              className="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
              {saving ? 'İptal ediliyor...' : 'Emin misiniz? Onayla'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
