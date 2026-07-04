// V2.2E: Ayarlar sayfasının en üstünde küçük bir özet gösteren kart.
// Sadece Settings.jsx'in ZATEN çektiği veriler üzerinden hesaplanır — yeni bir
// backend endpoint'i açılmadı, sadece mevcut veriler üzerinde basit türetme yapıldı.
export default function SettingsOverviewCard({ icon, label, value, hint }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm min-w-0">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-panel flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-muted truncate">{label}</div>
        <div className="text-base font-extrabold text-ink truncate">{value}</div>
        {hint && <div className="text-[11px] text-muted truncate">{hint}</div>}
      </div>
    </div>
  )
}
