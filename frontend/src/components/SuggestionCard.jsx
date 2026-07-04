import { formatDateWithDay, formatTime } from '../utils/format.js'

export default function SuggestionCard({ suggestion, onUse }) {
  const scoreColor = suggestion.score >= 90 ? 'text-green-600' : suggestion.score >= 80 ? 'text-amber-600' : 'text-muted'
  const scoreLabel = suggestion.score >= 90 ? 'En uygun' : suggestion.score >= 80 ? 'Uygun' : 'Alternatif'

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink">{formatDateWithDay(suggestion.date)}</div>
          <div className="text-xs text-muted">{formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold ${scoreColor}`}>{suggestion.score}</div>
          <div className="text-[10px] text-muted">{scoreLabel}</div>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">{suggestion.reason}</p>
      <button
        onClick={() => onUse(suggestion)}
        className="mt-auto bg-brand hover:bg-brand-light text-white font-bold py-2 rounded-lg text-sm transition-colors"
      >
        Bu slotu kullan
      </button>
    </div>
  )
}
