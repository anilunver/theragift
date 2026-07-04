export default function SuggestionCard({ suggestion, onUse }) {
  const scoreColor = suggestion.score >= 90 ? 'text-green-600' : suggestion.score >= 80 ? 'text-amber-600' : 'text-muted'

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink">{suggestion.date}</div>
          <div className="text-xs text-muted">{suggestion.startTime} - {suggestion.endTime}</div>
        </div>
        <div className={`text-2xl font-extrabold ${scoreColor}`}>{suggestion.score}</div>
      </div>
      <p className="text-xs text-muted">{suggestion.reason}</p>
      <button
        onClick={() => onUse(suggestion)}
        className="mt-auto bg-brand hover:bg-brand-light text-white font-bold py-2 rounded-lg text-sm"
      >
        Bu slotu kullan
      </button>
    </div>
  )
}
