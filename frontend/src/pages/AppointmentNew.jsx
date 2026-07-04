import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import PageHeader from '../components/PageHeader.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { todayIsoDate, addMinutes } from '../utils/format.js'

export default function AppointmentNew() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const preselectedClientId = location.state?.clientId || ''
  const hasPrefillEnd = Boolean(location.state?.prefillEnd)

  const [clients, setClients] = useState([])
  const [practiceProfile, setPracticeProfile] = useState(null)
  const [endTimeTouched, setEndTimeTouched] = useState(hasPrefillEnd)
  const [form, setForm] = useState({
    clientId: preselectedClientId,
    appointmentDate: location.state?.prefillDate || todayIsoDate(),
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
    // V2.2D: Pasif danışanlar yeni randevu formunda varsayılan olarak gösterilmez.
    api.get('/clients').then((res) => setClients((res.data || []).filter((c) => c.active)))
    api.get('/psychologist/profile').then((res) => {
      setPracticeProfile(res.data)
      // Danışan seçilmeden önce, formun varsayılanlarını pratik ayarlarından doldur.
      setForm((prev) => ({
        ...prev,
        sessionFee: prev.sessionFee || res.data.defaultSessionFee || '',
        sessionType: res.data.defaultSessionType || prev.sessionType,
        paymentMethod: res.data.defaultPaymentMethod || prev.paymentMethod,
        endTime: hasPrefillEnd ? prev.endTime : addMinutes(prev.startTime, res.data.defaultSessionDurationMinutes || 50),
      }))
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'endTime') setEndTimeTouched(true)
    if (name === 'startTime' && !endTimeTouched) {
      const duration = practiceProfile?.defaultSessionDurationMinutes || 50
      setForm((prev) => ({ ...prev, startTime: value, endTime: addMinutes(value, duration) }))
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleClientChange = (e) => {
    const clientId = e.target.value
    const client = clients.find((c) => String(c.id) === clientId)
    setForm({
      ...form,
      clientId,
      // Danışanın varsayılan ücreti / seans tercihi / ödeme yöntemi otomatik dolsun;
      // danışanda tanımlı değilse pratik ayarlarının varsayılanına düşülür.
      sessionFee: client?.defaultSessionFee ?? practiceProfile?.defaultSessionFee ?? form.sessionFee,
      sessionType: client?.sessionTypePreference || practiceProfile?.defaultSessionType || form.sessionType,
      paymentMethod: client?.defaultPaymentMethod || practiceProfile?.defaultPaymentMethod || form.paymentMethod,
    })
  }

  // Backend, çakışma (conflict) dışındaki durumlar için (mola/mesai dışı/danışan
  // uygunluğu) "yumuşak" uyarılar döner ve randevuyu KAYDETMEDEN önce onay ister.
  // Bu kontrol backend'de zorunlu — frontend sadece uyarıyı gösterip kullanıcı
  // onaylarsa overrideWarnings=true ile aynı isteği tekrar gönderir.
  const submitAppointment = async (overrideWarnings) => {
    const payload = {
      ...form,
      clientId: Number(form.clientId),
      sessionFee: form.sessionFee ? Number(form.sessionFee) : null,
      overrideWarnings,
    }
    const res = await api.post('/appointments', payload)

    if (res.data.requiresConfirmation) {
      const message = res.data.warnings.join('\n\n') + '\n\nYine de oluşturmak istiyor musunuz?'
      if (window.confirm(message)) {
        await submitAppointment(true)
      }
      return
    }

    showToast('Randevu oluşturuldu.')
    navigate('/calendar')
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
      await submitAppointment(false)
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.message || 'Bu saat aralığında zaten bir randevu var.')
      } else {
        setError(err.response?.data?.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.')
      }
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
 