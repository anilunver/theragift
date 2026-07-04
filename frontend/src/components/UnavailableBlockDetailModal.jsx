import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import {
  formatDate,
  formatTime,
  unavailableBlockTypeLabel,
  UNAVAILABLE_BLOCK_TYPE_STYLES,
  appointmentStatusLabel,
} from '../utils/format.js'

// V2.2C: Takvimdeki bir çalışma dışı/tatil badge'ine tıklanınca açılan detay
// modalı. Sadece görüntüleme + silme sağlar; randevulara hiç dokunmaz.
export default function UnavailableBlockDetailModal({ block, onClose, onDeleted }) {
  const { showToast } = useToast()
  const [deleting, setDeleting] = useState(false)

  if (!block) return null

  const safeAffected = Array.isArray(block.affectedAppointments) ? block.affectedAppointments : []

  const handleDelete = async () => {
    if (!window.confirm(`"${block.title}" bloğunu silmek istediğinize emin misiniz? Randevular etkilenmez.`)) return
    setDeleting(true)
    try {
      await api.delete(`/unavailable-blocks/${block.id}`)
      showToast('Blok silindi.')
      onDeleted()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message || 'Blok silinemedi.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-extrabold text-lg text-ink">{block.title}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${UNAVAILABLE_BLOCK_TYPE_STYLES[block.type] || 'bg-gray-200 text-gray-700'}`}>
            {unavailableBlockTypeLabel(block.type, block.title)}
          </span>
        </div>

        <div className="text-sm text-muted mb-4 space-y-1">
          <div>
            {formatDate(block.startDate)}
            {block.startDate !== block.endDate ? ` - ${formatDate(block.endDate)}` : ''}
          </div>
          <div>{block.fullDay ? 'Tam gün kapalı' : `${formatTime(block.startTime)} - ${formatTime(block.endTime)} arası kapalı`}</div>
          {block.note && <div className="text-ink">Not: {block.note}</div>}
        </div>

        <div className="mb-2">
          <div className="text-xs font-bold text-ink mb-1.5">
            Bu aralıkta planlı randevu: {safeAffected.length}
          </div>
          {safeAffected.length === 0 ? (
            <p className="text-xs text-muted">Bu blok aralığında planlı randevu yok.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {safeAffected.map((a) => (
                <div key={a.appointmentId} className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {formatDate(a.appointmentDate)} · {formatTime(a.startTime)} - {formatTime(a.endTime)} · {a.clientFullName}
                  </span>
                  <span className="text-[10px] font-bold shrink-0">{appointmentStatusLabel(a.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted mb-4">Bu blok mevcut randevuları otomatik iptal etmez.</p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors"
          >
            Kapat
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </div>
    </div>
  )
}
