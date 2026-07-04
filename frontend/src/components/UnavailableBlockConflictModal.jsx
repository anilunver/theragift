import { useNavigate } from 'react-router-dom'
import { formatDate, formatTime, sessionTypeLabel } from '../utils/format.js'

// V2.2C: Bir çalışma dışı/tatil bloğu oluşturulduktan sonra, o aralıkta
// planlı (aktif) randevu varsa toast'a EK olarak bu modal gösterilir.
// Sadece bilgilendirme amaçlıdır — hiçbir randevuyu silmez/iptal etmez.
export default function UnavailableBlockConflictModal({ block, onClose }) {
  const navigate = useNavigate()

  if (!block) return null

  const safeAffected = Array.isArray(block.affectedAppointments) ? block.affectedAppointments : []

  const handleGoToCalendar = () => {
    try {
      const targetDate = safeAffected[0]?.appointmentDate || block.startDate
      navigate('/calendar', { state: { targetDate } })
      onClose()
    } catch {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="font-extrabold text-lg mb-1 text-ink">Bu blok mevcut randevuları etkilemiyor</h3>
        <p className="text-xs text-muted mb-4">
          Bu tarih/saat aralığında planlı randevular var. Çalışma dışı blok oluşturuldu ama mevcut randevular
          otomatik iptal edilmedi.
        </p>

        <div className="mb-4">
          <div className="text-xs font-bold text-amber-700 mb-1.5">
            ⚠️ Etkilenen randevu sayısı: {safeAffected.length}
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {safeAffected.map((a) => (
              <div key={a.appointmentId} className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
                {formatDate(a.appointmentDate)} · {formatTime(a.startTime)} - {formatTime(a.endTime)} · {a.clientFullName}
                {' '}· {sessionTypeLabel(a.sessionType)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoToCalendar}
            className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel transition-colors"
          >
            Takvimde kontrol et
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}
