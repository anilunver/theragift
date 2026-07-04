import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import ClientTable from '../components/ClientTable.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { toTitleCase } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', email: '',
  sessionTypePreference: 'ONLINE', availabilityNotes: '',
  defaultSessionFee: '', defaultPaymentMethod: 'BANK_TRANSFER', notes: '',
}

export default function Clients() {
  const { showToast } = useToast()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [practiceDefaults, setPracticeDefaults] = useState(null)

  const loadClients = () => {
    setLoading(true)
    setError('')
    api.get('/clients')
      .then((res) => setClients(res.data))
      .catch(() => setError('Danışan listesi yüklenemedi. Sayfayı yenilemeyi deneyin.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadClients() }, [])

  useEffect(() => {
    api.get('/psychologist/profile')
      .then((res) => setPracticeDefaults(res.data))
      .catch(() => {})
  }, [])

  const openNewClientModal = () => {
    setForm({
      ...EMPTY_FORM,
      sessionTypePreference: practiceDefaults?.defaultSessionType || 'ONLINE',
      defaultSessionFee: practiceDefaults?.defaultSessionFee || '',
      defaultPaymentMethod: practiceDefaults?.defaultPaymentMethod || 'BANK_TRANSFER',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Ad ve soyad zorunludur.')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await api.post('/clients', {
        ...form,
        firstName: toTitleCase(form.firstName),
        lastName: toTitleCase(form.lastName),
        defaultSessionFee: form.defaultSessionFee ? Number(form.defaultSessionFee) : null,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      loadClients()
      showToast('Danışan eklendi.')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Danışan kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients
    .filter((c) => {
      if (statusFilter === 'ACTIVE') return c.active
      if (statusFilter === 'INACTIVE') return !c.active
      return true
    })
    .filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Danışanlar"
        description={`${clients.length} danışan kayıtlı`}
        action={
          <>
            <input
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-border rounded-xl px-3 py-2 text-sm w-36 sm:w-44"
            />
            <button
              type="button"
              onClick={openNewClientModal}
              className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap"
            >
              + Danışan Ekle
            </button>
          </>
        }
      />

      <div className="flex gap-2">
        {[
          { value: 'ACTIVE', label: 'Aktifler' },
          { value: 'INACTIVE', label: 'Pasifler' },
          { value: 'ALL', label: 'Tümü' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === opt.value
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-muted border-border hover:bg-panel'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState text="Danışanlar yükleniyor..." />
      ) : error ? (
        <ErrorState text={error} />
      ) : (
        <ClientTable clients={filtered} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="font-extrabold text-lg mb-1 text-ink">Yeni Danışan</h3>
            <p className="text-xs text-muted mb-4">Zorunlu alanlar: Ad, Soyad</p>
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
              <div className="grid grid-cols-2 gap-3">
                <select name="sessionTypePreference" value={form.sessionTypePreference} onChange={handleChange}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm">
                  <option value="ONLINE">Online</option>
                  <option value="FACE_TO_FACE">Yüz Yüze</option>
                </select>
                <input name="defaultSessionFee" value={form.defaultSessionFee} onChange={handleChange}
                  type="number" placeholder="Varsayılan Ücret (₺)"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <select name="defaultPaymentMethod" value={form.defaultPaymentMethod} onChange={handleChange}
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full">
                <option value="CASH">Nakit</option>
                <option value="BANK_TRANSFER">Havale/EFT</option>
                <option value="CREDIT_CARD_MANUAL">Manuel Kart</option>
                <option value="ONLINE_LINK">Online Link</option>
                <option value="PACKAGE">Paket</option>
                <option value="OTHER">Diğer</option>
              </select>
              <textarea name="availabilityNotes" value={form.availabilityNotes} onChange={handleChange}
                placeholder="Uygunluk notu (örn: Pazartesi ve Çarşamba öğleden sonra)"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" rows={2} />
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Genel notlar"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" rows={2} />

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel">İptal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
