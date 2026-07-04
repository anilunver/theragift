import { formatDate } from '../utils/format.js'

export default function GiftLicenseCard({ subscription }) {
  if (!subscription) return null

  return (
    <div className="bg-gradient-to-br from-brand-dark via-brand-light to-brand text-white rounded-2xl p-5 flex flex-col gap-2 shadow-md relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
      <div className="flex items-center justify-between relative">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-mint">Gift License</span>
        {subscription.giftLicense && (
          <span className="bg-white/20 text-[11px] font-bold px-2 py-1 rounded-full">Aktif</span>
        )}
      </div>
      <div className="text-2xl font-extrabold relative">{subscription.planName}</div>
      <div className="text-sm text-brand-mint/90 relative">
        {subscription.description || 'TheraGift tarafından hediye edilen ücretsiz lisans'}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-brand-mint/90 relative">
        <span>Bitiş tarihi: {formatDate(subscription.endDate)}</span>
        <span className="font-semibold">{subscription.status === 'ACTIVE' ? 'Aktif' : subscription.status}</span>
      </div>
      <div className="mt-3 relative">
        <div className="flex justify-between text-[11px] mb-1 text-brand-mint/90">
          <span>AI Kullanım Kotası</span>
          <span>{subscription.aiQuotaUsed} / {subscription.aiQuotaLimit}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (subscription.aiQuotaUsed / (subscription.aiQuotaLimit || 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
