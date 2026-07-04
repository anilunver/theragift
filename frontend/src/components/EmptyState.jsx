export default function EmptyState({ text, icon = '📭' }) {
  return (
    <div className="text-sm text-muted bg-white border border-dashed border-border rounded-2xl px-6 py-10 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      {text}
    </div>
  )
}
