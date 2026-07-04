import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { toTitleCase } from '../utils/format.js'

// Danışan düzenleme modalı. Mevcut PUT /api/clients/{id} endpoint'ini kullanır
// (ClientController zaten tüm bu alanları destekliyordu — V2.2A'da yeni bir
// backend değişikliği gerekmedi).
export default function ClientEditModal({ client, onClose, onUpdated }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    phone: client.phone || '',
    email: client.email || '',
    sessionTypePreference: client.sessionTypePreference || 'ONLINE',
    availabilityNotes: client.availabilityNotes || '',
    defaultSessionFee: client.defaultSessionFee ?? '',
    defaultPaymentMethod: client.defaultPaymentMethod || 'BANK_TRANSFER',
    notes: client.notes || '',
    active: client.active,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    const isDeactivating = client.active && !form.active
    setSaving(true)
    try {
      await api.put(`/clients/${client.id}`, {
        ...form,
        firstName: toTitleCase(form.firstName),
        lastName: toTitleCase(form.lastName),
        defaultSessionFee: form.defaultSessionFee ? Number(form.defaultSessionFee) : null,
      })

      if (isDeactivating) {
        // V2.2D.1: Danışan pasif yapılırken, gelecekte hâlâ SCHEDULED randevusu
        // varsa kullanıcıya bunları da iptal etmek isteyip istemediğini sor.
        // "Hayır" derse (ya da hiç gelecek randevusu yoksa) sadece active=false
        // kalır, randevulara dokunulmaz.
        try {
          const countRes = await api.get(`/clients/${client.id}/future-appointments-count`)
          const futureCount = countRes.data?.count || 0
          if (futureCount > 0) {
            const wantsCancel = window.confirm(
              `Bu danışanın gelecekte planlı ${futureCount} randevusu var. Pasif yaparken bu randevuları iptal etmek ister misiniz?`
            )
            if (wantsCancel) {
              await api.patch(`/clients/${client.id}/status`, { active: false, cancelFutureAppointments: true })
            }
          }
        } catch {
          // Ön kontrol/iptal isteği başarısız olsa bile danışan zaten pasif yapıldı —
          // bu ek adımdaki bir hata ana kaydı geçersiz kılmamalı, sessizce yok sayılır.
        }
        showToast('Danışan pasif yapıldı.')
      } else {
        showToast('Danışan güncellendi.')
      }
      onUpdated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Danışan güncellenemedi.')
      showToast(err.response?.data?.message || 'Danışan güncellenemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="font-extrabold text-lg mb-4 text-ink">Danışanı Düzenle</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ad *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Soyad *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Telefon</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">E-posta</label>
              <input name="email" value={form.email} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Seans Tercihi</label>
              <select name="sessionTypePreference" value={form.sessionTypePreference} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
                <option value="ONLINE">Online</option>
                <option value="FACE_TO_FACE">Yüz Yüze</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Varsayılan Ücret (₺)</label>
              <input name="defaultSessionFee" value={form.defaultSessionFee} onChange={handleChange} type="number"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Varsayılan Ödeme Yöntemi</label>
            <select name="defaultPaymentMethod" value={form.defaultPaymentMethod} onChange={handleChange}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="CASH">Nakit</option>
              <option value="BANK_TRANSFER">Havale/EFT</option>
              <option value="CREDIT_CARD_MANUAL">Manuel Kart</option>
              <option value="ONLINE_LINK">Online Link</option>
              <option value="PACKAGE">Paket</option>
              <option value="OTHER">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Uygunluk Notu</label>
            <textarea name="availabilityNotes" value={form.availabilityNotes} onChange={handleChange} rows={2}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Genel Notlar</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="w-4 h-4" />
            Danışan aktif
          </label>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel transition-colors">İptal</button>
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
