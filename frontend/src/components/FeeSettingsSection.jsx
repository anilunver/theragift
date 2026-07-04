import FeeManagementSection from './FeeManagementSection.jsx'
import { formatCurrency } from '../utils/format.js'

// V2.2E: "Ücretler" kategorisi. Mevcut varsayılan seans ücretini üstte bir
// bilgi kartı olarak gösterir, altında toplu ücret güncelleme aracını
// (FeeManagementSection — AYNEN korunuyor, hiçbir mantık değişmedi) barındırır.
export default function FeeSettingsSection({ profile, onApplied }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-extrabold text-ink text-lg">Ücret ve Seans Ayarları</h3>
        <p className="text-sm text-muted mt-0.5">
          Varsayılan seans ücretinizi görüntüleyin ve danışanlarınız için toplu ücret güncellemesi yapın.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">Mevcut Varsayılan Seans Ücreti</div>
          <div className="text-2xl font-extrabold text-ink mt-0.5">
            {profile?.defaultSessionFee ? formatCurrency(profile.defaultSessionFee) : 'Tanımlanmadı'}
          </div>
        </div>
        <p className="text-xs text-muted max-w-xs">
          Bu değeri "Klinik Profili" bölümünden tek danışan etkilemeden değiştirebilir, ya da aşağıdan
          birden çok danışan için toplu güncelleme yapabilirsiniz.
        </p>
      </div>

      <FeeManagementSection profile={profile} onApplied={onApplied} />
    </div>
  )
}
