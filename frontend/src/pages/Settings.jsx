import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import WorkingHoursForm from '../components/WorkingHoursForm.jsx'
import GiftLicenseCard from '../components/GiftLicenseCard.jsx'

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [workingHours, setWorkingHours] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [pendingForms, setPendingForms] = useState([])
  const [formLink, setFormLink] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const loadAll = () => {
    api.get('/psychologist/profile').then((res) => setProfile(res.data))
    api.get('/working-hours').then((res) => setWorkingHours(res.data))
    api.get('/subscription/current').then((res) => setSubscription(res.data))
    api.get('/availability-forms/pending').then((res) => setPendingForms(res.data))
  }

  useEffect(() => { loadAll() }, [])

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value })

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    try {
      await api.put('/psychologist/profile', profile)
      setSavedMsg('Profil güncellendi.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateLink = async () => {
    const res = await api.post('/availability-forms/create-link', {})
    setFormLink(res.data)
  }

  if (!profile) return <div className="text-muted">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-ink">Ayarlar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-extrabold text-ink mb-4">Psikolog Profili</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} placeholder="Ad Soyad"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <input name="title" value={profile.title || ''} onChange={handleProfileChange} placeholder="Unvan"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="specialty" value={profile.specialty || ''} onChange={handleProfileChange} placeholder="Uzmanlık alanı"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <input name="phone" value={profile.phone || ''} onChange={handleProfileChange} placeholder="Telefon"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="defaultSessionFee" value={profile.defaultSessionFee || ''} onChange={handleProfileChange}
                  placeholder="Varsayılan Seans Ücreti" className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <select name="defaultPaymentMethod" value={profile.defaultPaymentMethod || 'BANK_TRANSFER'} onChange={handleProfileChange}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm">
                  <option value="CASH">Nakit</option>
                  <option value="BANK_TRANSFER">Havale/EFT</option>
                  <option value="CREDIT_CARD_MANUAL">Kredi Kartı (Manuel)</option>
                  <option value="ONLINE_LINK">Online Link</option>
                  <option value="PACKAGE">Paket</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
              <textarea name="bio" value={profile.bio || ''} onChange={handleProfileChange} rows={2} placeholder="Kısa biyografi"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />

              {savedMsg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{savedMsg}</div>}

              <button type="submit" disabled={saving}
                className="bg-brand hover:bg-brand-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-extrabold text-ink mb-4">Çalışma Saatleri</h3>
            <WorkingHoursForm workingHours={workingHours} onChanged={loadAll} />
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-extrabold text-ink mb-2">Danışan Uygunluk Formu</h3>
            <p className="text-sm text-muted mb-3">Danışana özel bir link oluşturup uygunluk bilgilerini toplayabilirsiniz.</p>
            <button onClick={handleCreateLink}
              className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm">
              Yeni Form Linki Oluştur
            </button>
            {formLink && (
              <div className="mt-3 bg-panel rounded-xl p-3 text-sm break-all">
                <span className="text-muted">Link: </span>
                <a className="text-brand-light font-semibold" href={formLink.publicUrl} target="_blank" rel="noreferrer">
                  {window.location.origin}{formLink.publicUrl}
                </a>
              </div>
            )}

            {pendingForms.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-ink mb-2">Bekleyen Formlar ({pendingForms.length})</h4>
                <div className="space-y-2">
                  {pendingForms.map((f) => (
                    <div key={f.id} className="text-xs bg-panel rounded-lg px-3 py-2 flex justify-between">
                      <span>{f.clientFullName || 'Yeni danışan bekleniyor'}</span>
                      <span className="text-muted">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <GiftLicenseCard subscription={subscription} />
        </div>
      </div>
    </div>
  )
}
