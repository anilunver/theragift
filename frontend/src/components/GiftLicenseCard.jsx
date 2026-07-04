export default function GiftLicenseCard({ subscription }) {
  if (!subscription) return null

  return (
    <div className="bg-gradient-to-br from-brand-dark to-brand-light text-white rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wide text-brand-mint">Gift License</span>
        {subscription.giftLicense && (
          <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded-full">Aktif</span>
        )}
      </div>
      <div className="text-2xl font-extrabold">{subscription.planName}</div>
      <div className="text-sm text-brand-mint/90">{subscription.description}</div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <span>Bitiş: {subscription.endDate}</span>
        <span>{subscription.status}</span>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>AI Kullanım Kotası</span>
          <span>{subscription.aiQuotaUsed} / {subscription.aiQuotaLimit}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full"
            style={{ width: `${Math.min(100, (subscription.aiQuotaUsed / (subscription.aiQuotaLimit || 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
