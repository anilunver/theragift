// V2.4: `action` opsiyonel bir React node'dur (genelde bir yönlendirici buton/link).
// Geriye dönük uyumluluk için varsayılan `undefined` — mevcut tüm EmptyState
// kullanımları hiçbir değişiklik yapılmadan aynı şekilde çalışmaya devam eder.
export default function EmptyState({ text, icon = '📭', action }) {
  return (
    <div className="text-sm text-muted bg-white border border-dashed border-border rounded-2xl px-6 py-10 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div>{text}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
