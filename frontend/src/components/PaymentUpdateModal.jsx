import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency, toTitleCase } from '../utils/format.js'

export default function PaymentUpdateModal({ appointment, onClose, onUpdated }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    paymentStatus: appointment.paymentStatus,
    paymentMethod: appointment.paymentMethod || 'BANK_TRANSFER',
    paidAmount: appointment.paidAmount || 0,
    paymentDate: appointment.paymentDate || new Date().toISOString().slice(0, 10),
    paymentDueDate: appointment.paymentDueDate || '',
    paymentNote: appointment.paymentNote || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.put(`/appointments/${appointment.id}/payment`, {
        ...form,
        paidAmount: Number(form.paidAmount),
      })
      onUpdated()
      showToast('Ödeme güncellendi.')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ödeme güncellenemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-extrabold text-lg mb-1 text-ink">{toTitleCase(appointment.clientFullName)}</h3>
        <p className="text-xs text-muted mb-4">Seans ücreti: {formatCurrency(appointment.sessionFee)}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Ödeme Durumu</label>
            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="UNPAID">Ödenmedi</option>
              <option value="PAID">Ödendi</option>
              <option value="PAY_LATER">Sonra Ödenecek</option>
              <option value="PARTIAL_PAID">Kısmi Ödendi</option>
              <option value="PACKAGE_USED">Paketten Düşüldü</option>
              <option value="CANCELLED">İptal Edildi</option>
              <option value="NO_SHOW">Gelmedi</option>
              <option value="FREE">Ücretsiz</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ödeme Yöntemi</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}
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
              <label className="block text-xs font-semibold text-muted mb-1">Ödenen Tutar (₺)</label>
              <input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ödeme Tarihi</label>
              <input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Son Ödeme Tarihi</label>
              <input type="date" name="paymentDueDate" value={form.paymentDueDate} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Not</label>
            <textarea name="paymentNote" value={form.paymentNote} onChange={handleChange} rows={2}
              placeholder="Örn: Danışan seyahatte, ödeme sonra yapılacak"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel transition-colors">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
              {saving ? 'Kaydediliyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
