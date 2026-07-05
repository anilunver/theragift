import { formatDate } from '../utils/format.js'
import { useAuth } from '../context/AuthContext.jsx'

// V2.4: Gift License kartı, ürün kimliğini daha profesyonel göstermek için
// iyileştirildi. ÖNEMLİ: Hiçbir veri hardcode edilmedi/uydurulmadı — lisans
// sahibi ismi zaten var olan AuthContext'ten (giriş yapan kullanıcı), diğer
// tüm alanlar (planName, description, status, startDate, endDate,
// aiQuotaUsed/Limit) zaten var olan GET /api/subscription/current
// endpoint'inden geliyor. Backend'de "hediye eden" gibi ayrı bir alan
// olmadığı için bu sadece ürünün kendi kimliği olarak (TheraGift) sabit bir
// UI metni şeklinde gösteriliyor, gerçek bir veri alanı gibi sunulmuyor.
export default function GiftLicenseCard({ subscription }) {
  const { user } = useAuth()
  if (!subscription) return null

  return (
    <div className="bg-gradient-to-br from-brand-dark via-brand-light to-brand text-white rounded-2xl p-5 flex flex-col gap-2 shadow-md relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
      <div className="flex items-center justify-between relative flex-wrap gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-mint">Gift License</span>
        <div className="flex items-center gap-1.5">
          <span className="bg-white/15 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Pilot Sürüm</span>
          {subscription.giftLicense && (
            <span className="bg-white/20 text-[11px] font-bold px-2 py-1 rounded-full">Aktif</span>
          )}
        </div>
      </div>
      <div className="text-2xl font-extrabold relative">{subscription.planName}</div>
      <div className="text-sm text-brand-mint/90 relative">
        {subscription.description || 'TheraGift tarafından hediye edilen ücretsiz lisans'}
      </div>

      <div className="mt-2 space-y-1 text-xs text-brand-mint/90 relative">
        {user?.fullName && (
          <div className="flex justify-between">
            <span>Lisans sahibi</span>
            <span className="font-semibold text-white">{user.fullName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Hediye eden</span>
          <span className="font-semibold text-white">TheraGift</span>
        </div>
        {subscription.startDate && (
          <div className="flex justify-between">
            <span>Başlangıç tarihi</span>
            <span className="font-semibold text-white">{formatDate(subscription.startDate)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Bitiş tarihi</span>
          <span className="font-semibold text-white">{formatDate(subscription.endDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Durum</span>
          <span className="font-semibold text-white">{subscription.status === 'ACTIVE' ? 'Aktif' : subscription.status}</span>
        </div>
      </div>

      <div className="mt-3 relative">
        <div className="flex justify-between text-[11px] mb-1 text-brand-mint/90">
          <span>Kullanım Kotası</span>
          <span>{subscription.aiQuotaUsed} / {subscription.aiQuotaLimit}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (subscription.aiQuotaUsed / (subscription.aiQuotaLimit || 1)) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-brand-mint/80 mt-3 pt-3 border-t border-white/15 relative">
        Bu hesap pilot kullanım içindir. Gerçek danışan verisiyle kullanmadan önce KVKK ve veri saklama politikanızı gözden geçirin.
      </p>
    </div>
  )
}
