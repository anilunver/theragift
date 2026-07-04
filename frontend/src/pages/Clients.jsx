import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import ClientTable from '../components/ClientTable.jsx'

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', email: '',
  sessionTypePreference: 'ONLINE', availabilityNotes: '',
  defaultSessionFee: '', defaultPaymentMethod: 'BANK_TRANSFER', notes: '',
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadClients = () => {
    setLoading(true)
    api.get('/clients').then((res) => setClients(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadClients() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/clients', {
        ...form,
        defaultSessionFee: form.defaultSessionFee ? Number(form.defaultSessionFee) : null,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      loadClients()
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Danışanlar</h2>
          <p className="text-sm text-muted">{clients.length} danışan kayıtlı</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-sm w-40"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm"
          >
            + Danışan Ekle
          </button>
        </div>
      </div>

      {loading ? <div className="text-muted">Yükleniyor...</div> : <ClientTable clients={filtered} />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg mb-4">Yeni Danışan</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Ad"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Soyad"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
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
                <option value="CREDIT_CARD_MANUAL">Kredi Kartı (Manuel)</option>
                <option value="ONLINE_LINK">Online Link</option>
                <option value="PACKAGE">Paket</option>
                <option value="OTHER">Diğer</option>
              </select>
              <textarea name="availabilityNotes" value={form.availabilityNotes} onChange={handleChange}
                placeholder="Uygunluk notu (örn: Pazartesi ve Çarşamba öğleden sonra)"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" rows={2} />
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Genel notlar"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" rows={2} />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm">İptal</button>
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
