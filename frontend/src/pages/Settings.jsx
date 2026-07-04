import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios.js'
import PracticeProfileSettingsSection from '../components/PracticeProfileSettingsSection.jsx'
import WorkingScheduleSettingsSection from '../components/WorkingScheduleSettingsSection.jsx'
import FeeSettingsSection from '../components/FeeSettingsSection.jsx'
import AvailabilityFormsSettingsSection from '../components/AvailabilityFormsSettingsSection.jsx'
import SecurityDataSettingsSection from '../components/SecurityDataSettingsSection.jsx'
import SettingsCategoryNav from '../components/SettingsCategoryNav.jsx'
import SettingsOverviewCard from '../components/SettingsOverviewCard.jsx'
import GiftLicenseCard from '../components/GiftLicenseCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import { formatCurrency, formatDate, todayIsoDate } from '../utils/format.js'

// V2.2E: Ayarlar sayfası artık tek bir uzun, aşağı doğru büyüyen liste değil —
// kategori bazlı bir panel. Her kategori kendi component'ine ayrıldı ve her biri
// bağımsız bir ErrorBoundary ile sarıldı: bir kategoride beklenmeyen bir hata
// olursa sadece o kategori "hata" kartı gösterir, geri kalan Ayarlar sayfası
// (ve tüm uygulama) çalışmaya devam eder.
//
// ÖNEMLİ: Bu sprint SADECE görsel/yapısal bir yeniden düzenleme. Hiçbir backend
// endpoint'i değişmedi/eklenmedi; tüm veri çekme mantığı (api.get/.post/.put)
// aynı kaldı, sadece hangi component'in render ettiği değişti.
const CATEGORIES = [
  { key: 'profile', label: 'Klinik Profili', icon: '🏥' },
  { key: 'schedule', label: 'Çalışma Takvimi', icon: '🗓️' },
  { key: 'fees', label: 'Ücretler', icon: '💳' },
  { key: 'forms', label: 'Danışan Formları', icon: '📝' },
  { key: 'security', label: 'Güvenlik & Veri', icon: '🔒' },
]

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [workingHours, setWorkingHours] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [allForms, setAllForms] = useState([])
  const [unavailableBlocks, setUnavailableBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('profile')

  // V2.2E: Tüm kategorilerin ihtiyaç duyduğu veriler tek yerden, tek fonksiyonla
  // yükleniyor (önceki Settings.jsx'teki loadAll() ile aynı yaklaşım — sadece
  // /unavailable-blocks çağrısı özet kartı için eklendi). Her kategori component'i
  // kendi ilgili veriyi prop olarak alır, kendi fetch mantığını tekrar yazmaz.
  const loadAll = () => {
    api.get('/psychologist/profile').then((res) => setProfile(res.data))
    api.get('/working-hours').then((res) => setWorkingHours(Array.isArray(res.data) ? res.data : []))
    api.get('/subscription/current').then((res) => setSubscription(res.data))
    api.get('/availability-forms').then((res) => setAllForms(Array.isArray(res.data) ? res.data : []))
    // Sadece üstteki özet kartında "yaklaşan çalışma dışı blok" bilgisini göstermek
    // için — yeni bir endpoint DEĞİL, zaten var olan /unavailable-blocks burada da
    // (UnavailableBlocksSection'dan bağımsız olarak) ayrıca çağrılıyor.
    api.get('/unavailable-blocks')
      .then((res) => setUnavailableBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUnavailableBlocks([]))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/psychologist/profile'),
      api.get('/working-hours'),
      api.get('/subscription/current'),
      api.get('/availability-forms'),
      api.get('/unavailable-blocks').catch(() => ({ data: [] })),
    ])
      .then(([p, wh, sub, forms, blocks]) => {
        setProfile(p.data)
        setWorkingHours(Array.isArray(wh.data) ? wh.data : [])
        setSubscription(sub.data)
        setAllForms(Array.isArray(forms.data) ? forms.data : [])
        setUnavailableBlocks(Array.isArray(blocks.data) ? blocks.data : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const activeWorkingDaysCount = useMemo(
    () => workingHours.filter((wh) => wh.active).length,
    [workingHours]
  )

  const upcomingBlock = useMemo(() => {
    const today = todayIsoDate()
    return unavailableBlocks
      .filter((b) => b.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] || null
  }, [unavailableBlocks])

  const pendingFormsCount = useMemo(
    () => allForms.filter((f) => f.status === 'PENDING').length,
    [allForms]
  )

  if (loading || !profile) return <LoadingState text="Ayarlar yükleniyor..." />

  const renderCategory = () => {
    switch (category) {
      case 'schedule':
        return <WorkingScheduleSettingsSection workingHours={workingHours} onChanged={loadAll} />
      case 'fees':
        return <FeeSettingsSection profile={profile} onApplied={loadAll} />
      case 'forms':
        return <AvailabilityFormsSettingsSection allForms={allForms} onChanged={loadAll} />
      case 'security':
        return <SecurityDataSettingsSection />
      case 'profile':
      default:
        return <PracticeProfileSettingsSection profile={profile} onSaved={loadAll} />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Klinik, çalışma düzeni, ücretler ve danışan formlarını buradan yönetin."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SettingsOverviewCard
          icon="🗓️"
          label="Aktif Çalışma Günü"
          value={activeWorkingDaysCount}
        />
        <SettingsOverviewCard
          icon="🏖️"
          label="Yaklaşan Çalışma Dışı Blok"
          value={upcomingBlock ? upcomingBlock.title : 'Yok'}
          hint={upcomingBlock ? formatDate(upcomingBlock.startDate) : undefined}
        />
        <SettingsOverviewCard
          icon="💳"
          label="Varsayılan Seans Ücreti"
          value={profile.defaultSessionFee ? formatCurrency(profile.defaultSessionFee) : 'Tanımlanmadı'}
        />
        <SettingsOverviewCard
          icon="📝"
          label="Bekleyen Form"
          value={pendingFormsCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-6 items-start">
        <SettingsCategoryNav categories={CATEGORIES} active={category} onChange={setCategory} />

        <div className="min-w-0">
          <ErrorBoundary key={category}>
            {renderCategory()}
          </ErrorBoundary>
        </div>

        <div>
          <GiftLicenseCard subscription={subscription} />
        </div>
      </div>
    </div>
  )
}
