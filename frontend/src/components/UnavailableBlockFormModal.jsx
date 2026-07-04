import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { todayIsoDate } from '../utils/format.js'

// V2.2B: Çalışma dışı gün / tatil bloğu ekleme/düzenleme modalı.
// Takvimden "Bu günü kapat" ile de (initialDate ile önceden dolu) açılabilir,
// Ayarlar sayfasından da bağımsız olarak açılabilir.
export default function UnavailableBlockFormModal({ initialDate, onClose, onSaved }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    title: '',
    type: 'DAY_OFF',
    startDate: initialDate || todayIsoDate(),
    endDate: initialDate || todayIsoDate(),
    fullDay: true,
    startTime: '09:00',
    endTime: '17:00',
    note: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Başlık / sebep zorunludur.')
      return
    }
    if (form.startDate > form.endDate) {
      setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.')
      return
    }
    if (!form.fullDay && form.startTime >= form.endTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.')
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/unavailable-blocks', {
        ...form,
        startTime: form.fullDay ? null : form.startTime,
        endTime: form.fullDay ? null : form.endTime,
      })
      const affected = res.data?.affectedAppointmentsCount || 0
      if (affected > 0) {
        showToast(
          `Bu tarih aralığında ${affected} planlı randevu var. Bu blok randevuları otomatik iptal etmez. Lütfen takvimden kontrol edin.`,
          'warning',
        )
      } else {
        showToast('Çalışma dışı gün/tatil bloğu eklendi.')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Blok oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-extrabold text-lg mb-1 text-ink">Çalışma Dışı Gün / Tatil Ekle</h3>
        <p className="text-xs text-muted mb-4">Bu, mevcut randevuları otomatik iptal etmez — sadece uyarı amaçlıdır.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Başlık / Sebep *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="Örn: Yunanistan tatili"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Tür</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="DAY_OFF">Çalışma dışı</option>
              <option value="VACATION">Tatil</option>
              <option value="PERSONAL">Özel iş</option>
              <option value="HOLIDAY">Resmi tatil</option>
              <option value="CUSTOM">Diğer</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Başlangıç Tarihi *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Bitiş Tarihi *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" name="fullDay" checked={form.fullDay} onChange={handleChange} />
            Tam gün
          </label>

          {!form.fullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Başlangıç Saati *</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Bitiş Saati *</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Not</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={2}
              placeholder="Opsiyonel not"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
