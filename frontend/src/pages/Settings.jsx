import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import WorkingHoursForm from '../components/WorkingHoursForm.jsx'
import UnavailableBlocksSection from '../components/UnavailableBlocksSection.jsx'
import FeeManagementSection from '../components/FeeManagementSection.jsx'
import GiftLicenseCard from '../components/GiftLicenseCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { toTitleCase } from '../utils/format.js'

export default function Settings() {
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [workingHours, setWorkingHours] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [allForms, setAllForms] = useState([])
  const [formLink, setFormLink] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAll = () => {
    api.get('/psychologist/profile').then((res) => setProfile(res.data))
    api.get('/working-hours').then((res) => setWorkingHours(res.data))
    api.get('/subscription/current').then((res) => setSubscription(res.data))
    api.get('/availability-forms').then((res) => setAllForms(res.data))
  }

  useEffect(() => { loadAll() }, [])

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value })

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/psychologist/profile', {
        ...profile,
        fullName: toTitleCase(profile.fullName),
      })
      showToast('Profil kaydedildi.')
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Profil kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateLink = async () => {
    const res = await api.post('/availability-forms/create-link', {})
    setFormLink(res.data)
    setLinkCopied(false)
    showToast('Form linki oluşturuldu.')
    loadAll()
  }

  const fullLinkUrl = formLink ? `${window.location.origin}${formLink.publicUrl}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullLinkUrl)
      setLinkCopied(true)
      showToast('Link kopyalandı.')
    } catch {
      showToast('Link kopyalanamadı, manuel seçip kopyalayın.', 'error')
    }
  }

  const pendingForms = allForms.filter((f) => f.status === 'PENDING')
  const submittedForms = allForms.filter((f) => f.status === 'SUBMITTED')

  if (!profile) return <LoadingState text="Ayarlar yükleniyor..." />

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="Profil, çalışma saatleri ve danışan uygunluk formları" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
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
                  <option value="CREDIT_CARD_MANUAL">Manuel Kart</option>
                  <option value="ONLINE_LINK">Online Link</option>
                  <option value="PACKAGE">Paket</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
              <textarea name="bio" value={profile.bio || ''} onChange={handleProfileChange} rows={2} placeholder="Kısa biyografi"
                className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />

              <button type="submit" disabled={saving}
                className="bg-brand hover:bg-brand-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors">
                {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-ink mb-1">Klinik / Pratik Ayarları</h3>
            <p className="text-sm text-muted mb-4">Yeni danışan ve randevu oluştururken kullanılacak varsayılan değerler.</p>
            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="clinicName" value={profile.clinicName || ''} onChange={handleProfileChange} placeholder="Klinik / Pratik Adı"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <select name="currency" value={profile.currency || 'TRY'} onChange={handleProfileChange}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" name="defaultSessionDurationMinutes" value={profile.defaultSessionDurationMinutes || ''}
                  onChange={handleProfileChange} placeholder="Varsayılan Seans Süresi (dk)"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
                <select name="defaultSessionType" value={profile.defaultSessionType || 'ONLINE'} onChange={handleProfileChange}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm">
                  <option value="ONLINE">Online</option>
                  <option value="FACE_TO_FACE">Yüz Yüze</option>
                </select>
                <input type="number" name="defaultBufferMinutes" value={profile.defaultBufferMinutes || ''}
                  onChange={handleProfileChange} placeholder="Randevu Arası (dk)"
                  className="border border-border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <textarea name="practiceNotes" value={profile.practiceNotes || ''} onChange={handleProfileChange} rows={2}
                placeholder="Pratik notları (opsiyonel)" className="border border-border rounded-xl px-3 py-2.5 text-sm w-full" />

              <button type="submit" disabled={saving}
                className="bg-brand hover:bg-brand-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors">
                {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-ink mb-4">Çalışma Saatleri</h3>
            <WorkingHoursForm workingHours={workingHours} onChanged={loadAll} />
          </div>

          <UnavailableBlocksSection />

          <FeeManagementSection profile={profile} onApplied={loadAll} />

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-ink mb-2">Danışan Uygunluk Formu</h3>
            <p className="text-sm text-muted mb-3">Danışana özel bir link oluşturup uygunluk bilgilerini toplayabilirsiniz.</p>
            <button onClick={handleCreateLink}
              className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
              Yeni Form Linki Oluştur
            </button>
            {formLink && (
              <div className="mt-3 bg-panel rounded-xl p-3 flex items-center gap-2">
                <a
                  className="text-brand-light font-semibold text-sm truncate flex-1 min-w-0"
                  href={formLink.publicUrl} target="_blank" rel="noreferrer"
                  title={fullLinkUrl}
                >
                  {fullLinkUrl}
                </a>
                <button
                  onClick={handleCopyLink}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-white shrink-0 transition-colors"
                >
                  {linkCopied ? 'Kopyalandı ✓' : 'Kopyala'}
                </button>
              </div>
            )}

            <div className="mt-5">
              <h4 className="text-sm font-bold text-ink mb-2">Bekleyen Formlar ({pendingForms.length})</h4>
              {pendingForms.length === 0 ? (
                <EmptyState text="Bekleyen form yok." icon="📝" />
              ) : (
                <div className="space-y-2">
                  {pendingForms.map((f) => (
                    <div key={f.id} className="text-xs bg-panel rounded-lg px-3 py-2 flex justify-between">
                      <span>{f.clientFullName || 'Yeni danışan bekleniyor'}</span>
                      <span className="text-amber-700 font-semibold">Yanıt bekleniyor</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {submittedForms.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-bold text-ink mb-2">Yanıtlanan Formlar ({submittedForms.length})</h4>
                <div className="space-y-2">
                  {submittedForms.map((f) => (
                    <div key={f.id} className="text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-ink">{f.clientFullName || 'İsim belirtilmedi'}</span>
                        <span className="text-green-700 font-semibold">Yanıtlandı</span>
                      </div>
                      {f.preferredDays && <div className="text-muted">Uygun günler: {f.preferredDays}</div>}
                      {f.preferredTimeRange && <div className="text-muted">Uygun saat: {f.preferredTimeRange}</div>}
                      {f.notes && <div className="text-muted">Not: {f.notes}</div>}
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
