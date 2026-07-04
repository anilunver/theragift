export default function LoadingState({ text = 'Yükleniyor...' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
      <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {text}
    </div>
  )
}
