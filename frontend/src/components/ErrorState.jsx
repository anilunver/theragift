export default function ErrorState({ text }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-6 py-5 text-center">
      {text || 'Bir hata oluştu. Lütfen sayfayı yenileyin.'}
    </div>
  )
}
