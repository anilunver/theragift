import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency, toTitleCase, todayIsoDate } from '../utils/format.js'

// Ödenen tutar alanı hangi durumlarda editlenebilir/otomatik dolar.
// (Backend de aynı kuralları uygular — frontend burada sadece kullanıcıyı yönlendirir,
// kesin doğrulama her zaman backend'de yapılır.)
const PAID_AMOUNT_MODE = {
  PAID: 'full', // otomatik = seans ücreti
  UNPAID: 'zero',
  PAY_LATER: 'zero',
  FREE: 'zero',
  PACKAGE_USED: 'zero',
  PARTIAL_PAID: 'editable',
  CANCELLED: 'editable',
  NO_SHOW: 'editable',
}

export default function PaymentUpdateModal({ appointment, onClose, onUpdated }) {
  const { showToast } = useToast()
  const fee = Number(appointment.sessionFee || 0)

  const computeInitialPaidAmount = (status, current) => {
    const mode = PAID_AMOUNT_MODE[status] || 'editable'
    if (mode === 'full') return fee
    if (mode === 'zero') return 0
    return current
  }

  const [form, setForm] = useState({
    paymentStatus: appointment.paymentStatus,
    paymentMethod: appointment.paymentMethod || 'BANK_TRANSFER',
    paidAmount: appointment.paidAmount ?? 0,
    paymentDate: appointment.paymentDate || todayIsoDate(),
    paymentDueDate: appointment.paymentDueDate || '',
    paymentNote: appointment.paymentNote || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const paidAmountMode = PAID_AMOUNT_MODE[form.paymentStatus] || 'editable'
  const paidAmountDisabled = paidAmountMode === 'full' || paidAmountMode === 'zero'

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    setForm({
      ...form,
      paymentStatus: newStatus,
      paidAmount: computeInitialPaidAmount(newStatus, form.paidAmount),
    })
  }

  const validate = () => {
    const paid = Number(form.paidAmount)
    if (Number.isNaN(paid) || paid < 0) {
      return 'Ödenen tutar geçerli bir sayı olmalıdır.'
    }
    if (paid > fee) {
      return 'Ödenen tutar seans ücretinden fazla olamaz.'
    }
    if (form.paymentStatus === 'PARTIAL_PAID' && (paid <= 0 || paid >= fee)) {
      return 'Kısmi ödeme tutarı 0 ile seans ücreti arasında olmalıdır.'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

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
            <select name="paymentStatus" value={form.paymentStatus} onChange={handleStatusChange}
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
                disabled={paidAmountDisabled}
                max={fee} min={0}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm disabled:bg-panel disabled:text-muted" />
              {form.paymentStatus === 'PARTIAL_PAID' && (
                <p className="text-[11px] text-muted mt-1">0 ile {formatCurrency(fee)} arasında olmalı.</p>
              )}
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
