import { dayOfWeekLabel, formatDate, formatTime } from '../utils/format.js'

// V2.2A.1/A.2: Sabit randevu üretiminde warning varsa randevular oluşturulmadan
// ÖNCE bu modal gösterilir. Kullanıcı "Vazgeç" derse hiçbir randevu oluşmaz;
// "Yine de oluştur" derse backend'e overrideWarnings=true ile tekrar istek atılır.
//
// V2.2A.2: `rule`, `blockers`, `warnings` her zaman güvenli bir şekilde okunur —
// beklenmeyen/eksik veri bu modalin (ve dolayısıyla tüm sayfanın) çökmesine
// asla yol açmaz.
export default function RecurringConfirmModal({ rule, blockers, warnings, saving, onCancel, onConfirm }) {
  if (!rule) return null

  const safeBlockers = Array.isArray(blockers) ? blockers : []
  const safeWarnings = Array.isArray(warnings) ? warnings : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="font-extrabold text-lg mb-1 text-ink">Uyarılarla Devam Edilsin mi?</h3>
        <p className="text-xs text-muted mb-4">
          {dayOfWeekLabel(rule.dayOfWeek)} {formatTime(rule.startTime)} - {formatTime(rule.endTime)} sabit randevu kuralı
          için bazı occurrence'larda uyarı bulundu. Hiçbir randevu HENÜZ oluşturulmadı.
        </p>

        {safeBlockers.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-red-700 mb-1.5">
              🚫 Engellenen (bu slotlar kesinlikle oluşturulmayacak):
            </div>
            <ul className="space-y-1">
              {safeBlockers.map((b, idx) => (
                <li key={idx} className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-800">
                  {formatDate(b?.date)} {formatTime(b?.startTime)} - {formatTime(b?.endTime)}: {b?.message || 'Çakışma'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {safeWarnings.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-amber-700 mb-1.5">
              ⚠️ Uyarılar (isterseniz yine de oluşturabilirsiniz):
            </div>
            <ul className="space-y-1">
              {safeWarnings.map((w, idx) => (
                <li key={idx} className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
                  {formatDate(w?.date)} {formatTime(w?.startTime)} - {formatTime(w?.endTime)}: {w?.message || 'Uyarı'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors"
          >
            {saving ? 'Oluşturuluyor...' : 'Yine de oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}
