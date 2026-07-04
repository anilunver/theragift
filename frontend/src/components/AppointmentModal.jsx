import { useState } from 'react'
import api from '../api/axios.js'
import PaymentStatusBadge from './PaymentStatusBadge.jsx'

export default function AppointmentModal({ appointment, onClose, onUpdated }) {
  const [status, setStatus] = useState(appointment.status)
  const [saving, setSaving] = useState(false)

  const handleStatusChange = async (newStatus) => {
    setSaving(true)
    try {
      await api.put(`/appointments/${appointment.id}`, { status: newStatus })
      setStatus(newStatus)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    setSaving(true)
    try {
      await api.delete(`/appointments/${appointment.id}`)
      onUpdated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-ink">{appointment.clientFullName}</h3>
          <PaymentStatusBadge status={appointment.paymentStatus} />
        </div>

        <div className="space-y-2 text-sm mb-5">
          <div><span className="text-muted">Tarih:</span> <strong>{appointment.appointmentDate}</strong></div>
          <div><span className="text-muted">Saat:</span> <strong>{appointment.startTime} - {appointment.endTime}</strong></div>
          <div><span className="text-muted">Tür:</span> <strong>{appointment.sessionType === 'ONLINE' ? 'Online' : 'Yüz Yüze'}</strong></div>
          <div><span className="text-muted">Ücret:</span> <strong>₺{appointment.sessionFee}</strong></div>
          <div><span className="text-muted">Durum:</span> <strong>{status}</strong></div>
          {appointment.notes && <div><span className="text-muted">Not:</span> {appointment.notes}</div>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button disabled={saving} onClick={() => handleStatusChange('COMPLETED')}
            className="text-xs font-bold py-2 rounded-lg bg-green-100 text-green-800 disabled:opacity-50">Tamamlandı</button>
          <button disabled={saving} onClick={() => handleStatusChange('NO_SHOW')}
            className="text-xs font-bold py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50">Gelmedi</button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm">Kapat</button>
          <button disabled={saving} onClick={handleCancel}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60">
            Randevuyu İptal Et
          </button>
        </div>
      </div>
    </div>
  )
}
