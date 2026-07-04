import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

export default function PublicFormPage() {
  const { token } = useParams()
  const [formInfo, setFormInfo] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    preferredDays: '', preferredTimeRange: '', notes: '',
  })

  useEffect(() => {
    api.get(`/public/forms/${token}`)
      .then((res) => {
        setFormInfo(res.data)
        setSubmitted(res.data.alreadySubmitted)
      })
      .catch(() => setError('Bu form bulunamadı veya süresi dolmuş. Lütfen psikoloğunuzdan yeni bir link isteyin.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post(`/public/forms/${token}/submit`, form)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Form gönderilemedi, lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2" />
        Yükleniyor...
      </div>
    )
  }

  if (error && !formInfo) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-border rounded-3xl p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-extrabold text-brand-dark">TheraGift</div>
          <div className="text-sm text-muted mt-1">Danışan Uygunluk Formu</div>
          {formInfo?.psychologistName && (
            <div className="text-xs font-semibold text-ink mt-2 bg-panel inline-block px-3 py-1 rounded-full">
              Psikolog: {formInfo.psychologistName}
            </div>
          )}
        </div>

        {submitted ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-extrabold text-lg text-ink mb-2">Teşekkürler!</div>
            <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
              Uygunluk bilgileriniz psikoloğunuza iletildi. Randevu planlaması için sizinle iletişime geçilecektir.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Ad *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Ad"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Soyad *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Soyad"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefon"
                className="border border-border rounded-xl px-3 py-2.5 text-sm" />
              <input name="email" value={form.email} onChange={handleChange} placeholder="E-posta"
                className="border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Uygun olduğunuz günler</label>
              <input name="preferredDays" value={form.preferredDays} onChange={handleChange}
                placeholder="Örn: Pazartesi, Çarşamba"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Uygun saat aralığı</label>
              <input name="preferredTimeRange" value={form.preferredTimeRange} onChange={handleChange}
                placeholder="Örn: 10:00-14:00"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ek notlarınız</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder="Randevu planlamasıyla ilgili eklemek istediğiniz bilgi (isteğe bağlı)"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={saving}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl disabled:opacity-60 transition-colors">
              {saving ? 'Gönderiliyor...' : 'Gönder'}
            </button>

            <p className="text-[11px] text-muted text-center pt-1">
              Bu form yalnızca uygunluk bilgilerinizi toplamak içindir; tanı, tedavi veya klinik değerlendirme içermez.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
