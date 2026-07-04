import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import PageHeader from '../components/PageHeader.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function AppointmentNew() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const preselectedClientId = location.state?.clientId || ''

  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    clientId: preselectedClientId,
    appointmentDate: location.state?.prefillDate || new Date().toISOString().slice(0, 10),
    startTime: location.state?.prefillStart || '10:00',
    endTime: location.state?.prefillEnd || '10:50',
    sessionType: 'ONLINE',
    sessionFee: '',
    paymentStatus: 'UNPAID',
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleClientChange = (e) => {
    const clientId = e.target.value
    const client = clients.find((c) => String(c.id) === clientId)
    setForm({
      ...form,
      clientId,
      // Danışanın varsayılan ücreti / seans tercihi / ödeme yöntemi otomatik dolsun
      sessionFee: client?.defaultSessionFee ?? form.sessionFee,
      sessionType: client?.sessionTypePreference || form.sessionType,
      paymentMethod: client?.defaultPaymentMethod || form.paymentMethod,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.clientId) {
      setError('Lütfen bir danışan seçin.')
      return
    }
    if (form.startTime >= form.endTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.')
      return
    }

    setSaving(true)
    try {
      await api.post('/appointments', {
        ...form,
        clientId: Number(form.clientId),
        sessionFee: form.sessionFee ? Number(form.sessionFee) : null,
      })
      showToast('Randevu oluşturuldu.')
      navigate('/calendar')
    } catch (err) {
      setError(err.response?.data?.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Yeni Randevu" description="Danışan, tarih ve seans bilgilerini girin" />

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Danışan *</label>
          <select name="clientId" value={form.clientId} onChange={handleClientChange} required
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
            <option value="">Seçiniz</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-amber-700 mt-1">Henüz danışan yok — önce Danışanlar sayfasından ekleyin.</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Tarih *</label>
            <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Başlangıç *</label>
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Bitiş *</label>
            <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Seans Türü</label>
            <select name="sessionType" value={form.sessionType} onChange={handleChange}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="ONLINE">Online</option>
              <option value="FACE_TO_FACE">Yüz Yüze</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Seans Ücreti (₺)</label>
            <input type="number" name="sessionFee" value={form.sessionFee} onChange={handleChange}
              placeholder="Danışanın varsayılan ücreti kullanılır"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Ödeme Durumu</label>
            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="UNPAID">Ödenmedi</option>
              <option value="PAID">Ödendi</option>
              <option value="PAY_LATER">Sonra Ödenecek</option>
              <option value="PARTIAL_PAID">Kısmi Ödendi</option>
              <option value="PACKAGE_USED">Paketten Düşüldü</option>
              <option value="FREE">Ücretsiz</option>
            </select>
          </div>
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Not</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel transition-colors">İptal</button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Randevu Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
