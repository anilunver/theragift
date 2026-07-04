import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { toTitleCase } from '../utils/format.js'

// V2.2E: "Klinik Profili" kategorisi. Önceki Settings.jsx'te ayrı ayrı duran
// "Psikolog Profili" ve "Klinik / Pratik Ayarları" kartları tek bir mantıksal
// form haline getirildi — ikisi de zaten AYNI backend endpoint'ini
// (PUT /api/psychologist/profile) ve AYNI profil objesini kullanıyordu, bu
// yüzden iki ayrı form/iki ayrı "Kaydet" butonu göstermek kafa karıştırıcıydı.
// Backend'de HİÇBİR değişiklik yok — sadece frontend'de tek forma indirgendi.
export default function PracticeProfileSettingsSection({ profile, onSaved }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/psychologist/profile', {
        ...form,
        fullName: toTitleCase(form.fullName),
      })
      showToast('Ayarlar kaydedildi.')
      onSaved()
    } catch (err) {
      showToast(err.response?.data?.message || 'Ayarlar kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-extrabold text-ink text-lg">Klinik Profili</h3>
        <p className="text-sm text-muted mt-0.5">
          Psikolog ve klinik bilgileriniz, yeni danışan/randevu oluştururken varsayılan olarak kullanılır.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Kimlik Bilgileri</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="fullName" value={form.fullName || ''} onChange={handleChange} placeholder="Ad Soyad"
              className="border border-border rounded-xl px-3 py-2.5 text-sm" />
            <input name="title" value={form.title || ''} onChange={handleChange} placeholder="Unvan"
              className="border border-border rounded-xl px-3 py-2.5 text-sm" />
            <input name="clinicName" value={form.clinicName || ''} onChange={handleChange} placeholder="Klinik / Pratik Adı"
              className="border border-border rounded-xl px-3 py-2.5 text-sm" />
            <input name="specialty" value={form.specialty || ''} onChange={handleChange} placeholder="Uzmanlık alanı"
              className="border border-border rounded-xl px-3 py-2.5 text-sm" />
            <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Telefon"
              className="border border-border rounded-xl px-3 py-2.5 text-sm sm:col-span-2" />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Seans Varsayılanları</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Varsayılan Seans Türü</label>
              <select name="defaultSessionType" value={form.defaultSessionType || 'ONLINE'} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
                <option value="ONLINE">Online</option>
                <option value="FACE_TO_FACE">Yüz Yüze</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Varsayılan Seans Süresi (dk)</label>
              <input type="number" name="defaultSessionDurationMinutes" value={form.defaultSessionDurationMinutes || ''}
                onChange={handleChange} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Randevu Arası (dk)</label>
              <input type="number" name="defaultBufferMinutes" value={form.defaultBufferMinutes || ''}
                onChange={handleChange} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Varsayılan Seans Ücreti</label>
              <input type="number" name="defaultSessionFee" value={form.defaultSessionFee || ''} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Para Birimi</label>
              <select name="currency" value={form.currency || 'TRY'} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Varsayılan Ödeme Yöntemi</label>
              <select name="defaultPaymentMethod" value={form.defaultPaymentMethod || 'BANK_TRANSFER'} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
                <option value="CASH">Nakit</option>
                <option value="BANK_TRANSFER">Havale/EFT</option>
                <option value="CREDIT_CARD_MANUAL">Manuel Kart</option>
                <option value="ONLINE_LINK">Online Link</option>
                <option value="PACKAGE">Paket</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Açıklama / Notlar</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea name="bio" value={form.bio || ''} onChange={handleChange} rows={2} placeholder="Kısa biyografi"
              className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />
            <textarea name="practiceNotes" value={form.practiceNotes || ''} onChange={handleChange} rows={2}
              placeholder="Pratik notları (opsiyonel)" className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving}
            className="bg-brand hover:bg-brand-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
