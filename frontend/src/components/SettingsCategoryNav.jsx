// V2.2E: Ayarlar sayfasının kategori navigasyonu. Aynı bileşen, sadece CSS ile
// iki farklı görünüme bürünür: masaüstünde dikey sol menü, mobilde yatay
// scroll edilebilir sekme barı — bu yüzden tek bir component yeterli, ayrı
// "mobile/desktop" component çifti gerekmiyor (gereksiz karmaşıklık).
export default function SettingsCategoryNav({ categories, active, onChange }) {
  return (
    <nav
      className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0"
      aria-label="Ayarlar kategorileri"
    >
      {categories.map((cat) => {
        const isActive = cat.key === active
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onChange(cat.key)}
            className={`shrink-0 lg:shrink lg:w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap lg:whitespace-normal ${
              isActive
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white border border-border text-ink hover:bg-panel'
            }`}
          >
            {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
            <span className="truncate">{cat.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
