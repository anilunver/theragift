import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'

// V2.4: "Başlangıç Kontrol Listesi" — yeni bir psikolog sisteme girdiğinde
// nereden başlayacağını anlaması için basit bir onboarding checklist'i.
// ÖNEMLİ: Hiçbir yeni backend endpoint'i veya tablo eklenmedi. Tamamlanma
// durumu tamamen frontend'de, zaten var olan endpointlerden (profil, çalışma
// saatleri, danışanlar, randevular, formlar) çekilen veriyle hesaplanır.
// "Raporlar sayfasını incele" maddesi API'den hesaplanamayacağı için sadece
// kullanıcı Raporlar sayfasını bir kez ziyaret ettiğinde localStorage'a
// yazılan basit bir bayrakla işaretlenir — sunucu tarafında hiçbir iz tutulmaz.
const VISITED_REPORTS_KEY = 'theragift_visited_reports'
const DISMISSED_KEY = 'theragift_onboarding_dismissed'

export function markReportsVisited() {
  try {
    localStorage.setItem(VISITED_REPORTS_KEY, 'true')
  } catch {
    // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce yok say —
    // checklist bu durumda sadece o maddeyi eksik gösterir, çökmez.
  }
}

export default function OnboardingChecklist() {
  const [data, setData] = useState(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed) return
    Promise.all([
      api.get('/psychologist/profile').catch(() => null),
      api.get('/working-hours').catch(() => null),
      api.get('/clients').catch(() => null),
      api.get('/appointments').catch(() => null),
      api.get('/availability-forms').catch(() => null),
    ]).then(([profileRes, whRes, clientsRes, apptRes, formsRes]) => {
      setData({
        profile: profileRes?.data || null,
        workingHoursCount: Array.isArray(whRes?.data) ? whRes.data.length : 0,
        clientsCount: Array.isArray(clientsRes?.data) ? clientsRes.data.length : 0,
        appointmentsCount: Array.isArray(apptRes?.data) ? apptRes.data.length : 0,
        formsCount: Array.isArray(formsRes?.data) ? formsRes.data.length : 0,
      })
    })
  }, [dismissed])

  if (dismissed || !data) return null

  const visitedReports = (() => {
    try {
      return localStorage.getItem(VISITED_REPORTS_KEY) === 'true'
    } catch {
      return false
    }
  })()

  const items = [
    {
      label: 'Klinik profilini tamamla',
      done: Boolean(data.profile?.clinicName || data.profile?.title || data.profile?.specialty),
      to: '/settings',
    },
    {
      label: 'Çalışma saatlerini belirle',
      done: data.workingHoursCount > 0,
      to: '/settings',
    },
    {
      label: 'Varsayılan seans ücretini ayarla',
      done: Boolean(data.profile?.defaultSessionFee),
      to: '/settings',
    },
    {
      label: 'İlk danışanını ekle',
      done: data.clientsCount > 0,
      to: '/clients',
    },
    {
      label: 'İlk randevunu oluştur',
      done: data.appointmentsCount > 0,
      to: '/appointments/new',
    },
    {
      label: 'Danışan form linkini oluştur',
      done: data.formsCount > 0,
      to: '/settings',
    },
    {
      label: 'Raporlar sayfasını incele',
      done: visitedReports,
      to: '/reports',
    },
  ]

  const completedCount = items.filter((i) => i.done).length
  const allDone = completedCount === items.length

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // yok say
    }
    setDismissed(true)
  }

  // V2.5: Tüm adımlar tamamlandığında uzun kontrol listesi yerine, Dashboard'ta
  // az yer kaplayan, profesyonel görünen kompakt bir "hazır" kartı gösterilir.
  if (allDone) {
    return (
      <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
          <span>✅</span>
          <span>Pilot hazırlık tamamlandı — panel demo için hazır.</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-semibold text-green-800/70 hover:text-green-900 shrink-0"
          title="Kartı gizle"
        >
          ✕ Gizle
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="font-extrabold text-ink">TheraGift'i kullanıma hazırla</h3>
          <p className="text-xs text-muted mt-0.5">
            Birkaç adımda panelinizi pilot kullanıma hazır hale getirin.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-semibold text-muted hover:text-ink shrink-0"
          title="Kontrol listesini gizle"
        >
          ✕ Gizle
        </button>
      </div>

      <div className="mt-3 mb-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted mb-1">
          <span>{completedCount} / {items.length} tamamlandı</span>
          {allDone && <span className="text-green-700">🎉 Hepsi tamam!</span>}
        </div>
        <div className="w-full bg-panel rounded-full h-1.5">
          <div
            className="bg-brand h-1.5 rounded-full transition-all"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                item.done ? 'bg-green-100 text-green-700' : 'bg-panel text-muted'
              }`}>
                {item.done ? '✓' : ''}
              </span>
              <span className={`truncate ${item.done ? 'text-muted line-through' : 'text-ink font-medium'}`}>
                {item.label}
              </span>
            </div>
            {!item.done && (
              <Link
                to={item.to}
                className="text-xs font-bold text-brand-light hover:underline shrink-0"
              >
                Git →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
