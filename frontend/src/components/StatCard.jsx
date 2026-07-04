export default function StatCard({ label, value, hint, tone = 'default' }) {
  const toneClasses = {
    default: 'text-ink',
    positive: 'text-brand-light',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-1 min-w-0 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-xs font-semibold text-muted truncate">{label}</span>
      <span className={`text-2xl font-extrabold truncate ${toneClasses[tone]}`}>{value}</span>
      {hint && <span className="text-[11px] text-muted truncate">{hint}</span>}
    </div>
  )
}
