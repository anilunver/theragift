// V2.2E: "Güvenlik & Veri" kategorisi. Bilinçli olarak TAMAMEN placeholder —
// hiçbir backend çağrısı yapmaz, hiçbir gerçek işlev sunmaz. Bu sprintin
// kapsamı sadece Ayarlar sayfasının bilgi mimarisini/UX'ini düzenlemek;
// KVKK/veri dışa aktarma/hesap silme/audit log gibi gerçek özellikler
// kasıtlı olarak MVP sonrasına bırakıldı. Sadece profesyonel görünmesi
// ve kullanıcıya "burada olacak" bilgisini vermesi için var.
const PLACEHOLDER_ITEMS = [
  {
    title: 'KVKK / Gizlilik Notu',
    description: 'Danışan verilerinizin nasıl saklandığına ve korunduğuna dair bilgilendirme metni.',
    badge: 'Yakında',
  },
  {
    title: 'Veri Dışa Aktarma',
    description: 'Danışan, randevu ve ödeme verilerinizi dışa aktarma (export) özelliği.',
    badge: 'MVP sonrası',
  },
  {
    title: 'Hesap Silme Talebi',
    description: 'Hesabınızı ve tüm verilerinizi kalıcı olarak silme talebinde bulunma.',
    badge: 'MVP sonrası',
  },
  {
    title: 'Aktivite Kaydı (Audit Log)',
    description: 'Hesabınızda yapılan önemli işlemlerin (giriş, güncelleme, silme) kayıt geçmişi.',
    badge: 'Yakında',
  },
]

const BADGE_STYLES = {
  'Yakında': 'bg-amber-100 text-amber-800',
  'MVP sonrası': 'bg-gray-200 text-gray-600',
}

export default function SecurityDataSettingsSection() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-extrabold text-ink text-lg">Güvenlik &amp; Veri</h3>
        <p className="text-sm text-muted mt-0.5">
          Veri güvenliği ve gizlilik ile ilgili özellikler burada yer alacak.
        </p>
      </div>

      {/* V2.4: MVP/KVKK uyarısı — gerçek bir hukuk metni değildir, sadece
          pilot kullanım öncesi kullanıcıyı bilgilendiren kısa bir not. */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
        <p className="font-bold">⚠ MVP / KVKK Notu</p>
        <p>Bu MVP klinik karar vermez; terapi, teşhis veya tedavi önerisi üretmez.</p>
        <p>Danışan notları hassas veri olabilir. Gerçek kullanım öncesi KVKK ve veri saklama politikası hazırlanmalıdır.</p>
        <p>Pilot testte gerçek danışan verisi yerine anonim/test veri kullanılması önerilir.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLACEHOLDER_ITEMS.map((item) => (
          <div key={item.title} className="bg-white border border-border rounded-2xl p-5 shadow-sm opacity-90">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="font-bold text-ink text-sm">{item.title}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${BADGE_STYLES[item.badge]}`}>
                {item.badge}
              </span>
            </div>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
