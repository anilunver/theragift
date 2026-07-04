import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import PaymentStatusBadge from './PaymentStatusBadge.jsx'
import AppointmentStatusBadge from './AppointmentStatusBadge.jsx'
import PaymentUpdateModal from './PaymentUpdateModal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency, formatDate, formatTime, sessionTypeLabel } from '../utils/format.js'

export default function AppointmentModal({ appointment, onClose, onUpdated }) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState(appointment.status)
  const [saving, setSaving] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false)

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

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          {appointment.clientId && (
            <button
              type="button"
              onClick={() => navigate(`/clients/${appointment.clientId}`)}
              className="text-xs font-semibold text-brand-light hover:underline"
            >
              Danışan detayına git →
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPaymentUpdate(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors"
          >
            💳 Ödeme Güncelle
          </button>
        </div>

        {status !== 'CANCELLED' && (
          <div className="mb-4">
            <h4 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Randevu Durumunu Güncelle</h4>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={saving} onClick={() => handleStatusChange('COMPLETED', 'Randevu tamamlandı olarak işaretlendi.')}
                className="text-xs font-bold py-2 rounded-lg bg-green-100 text-green-800 hover:bg-