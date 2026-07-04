import { formatDateWithDay, formatTime } from '../utils/format.js'

// V2.2A.2: Etiket ("En uygun"/"Uygun"/"Alternatif"/"Yoğun gün") artık backend'de
// (SuggestionService.matchLabel) tek bir yerden hesaplanıyor — frontend kendi
// eşik değerleriyle tahmin yürütmüyor, sadece gösteriyor. Backend eski bir
// sürümdeyse (matchLabel alanı yoksa) yine de kırılmadan makul bir varsayılana düşer.
const fallbackLabel = (score) => (score >= 90 ? 'En uygun' : score >= 70 ? 'Uygun' : 'Alternatif')

const LABEL_STYLES = {
  'En uygun': 'bg-green-100 text-green-800',
  'Uygun': 'bg-blue-100 text-blue-800',
  'Alternatif': 'bg-amber-100 text-amber-800',
  'Yoğun gün': 'bg-gray-200 text-gray-700',
}

export default function SuggestionCard({ suggestion, onUse }) {
  const score = suggestion.score ?? 0
  const label = suggestion.matchLabel || fallbackLabel(score)
  const scoreColor = score >= 90 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-muted'

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink">{formatDateWithDay(suggestion.date)}</div>
          <div className="text-xs text-m