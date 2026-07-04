import { formatDateWithDay, formatTime } from '../utils/format.js'

// V2.2A.2: Etiket ("En uygun"/"Uygun"/"Alternatif"/"Yoğun gün") artık backend'de
// (SuggestionService.matchLabel) tek bir yerden hesaplanıyor — frontend kendi
// eşik değerleriyle tahmin yürütmüyor, sadece gösteriyor. Backend eski bir
// sürümdeyse (matchLabel alanı yoksa) yine de kırılmadan makul bir varsayılana düşer.
const fallbackLabel = (score) => (score >= 90 ? 'En uygun' : score >= 70 ? 'Uygun' : 'Alternatif')

export default function SuggestionCard({ suggestion, onUse }) {
  const score = suggestion.score ?? 0
  const label = suggestion.matchLabel || fallbackLabel(score)
  const scoreColor = score >= 90 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-muted'

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink">{formatDateWithDay(suggestion.date)}</div>
          <div className="text-xs text-muted">{formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold ${scoreColor}`}>{score}</div>
          <div className="text-[10px] font-semibold text-muted">{label}</div>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">{suggestion.reason}</p>
      <button
        type="button"
        onClick={() => onUse(suggestion)}
        className="mt-auto bg-brand hover:bg-brand-light text-white font-bold py-2 rounded-lg text-sm transition-colors"
      >
        Bu slotu kullan
      </button>
    </div>
  )
}
