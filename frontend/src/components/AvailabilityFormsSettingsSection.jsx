import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from './EmptyState.jsx'

// V2.2E: "Danışan Formları" kategorisi. Önceki Settings.jsx'in en alt
// bölümündeki form-linki oluşturma ve bekleyen/yanıtlanan form listeleri
// buraya AYNEN taşındı — endpoint'ler ve davranış değişmedi
// (POST /availability-forms/create-link, GET /availability-forms).
export default function AvailabilityFormsSettingsSection({ allForms, onChanged }) {
  const { showToast } = useToast()
  const [formLink, setFormLink] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCreateLink = async () => {
    try {
      const res = await api.post('/availability-forms/create-link', {})
      setFormLink(res.data)
      setLinkCopied(false)
      showToast('Form linki oluşturuldu.')
      onChanged()
    } catch (err) {
      showToast(err.response?.data?.message || 'Form linki oluşturulamadı.', 'error')
    }
  }

  const fullLinkUrl = formLink ? `${window.location.origin}${formLink.publicUrl}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullLinkUrl)
      setLinkCopied(true)
      showToast('Link kopyalandı.')
    } catch {
      showToast('Link kopyalanamadı, manuel seçip kopyalayın.', 'error')
    }
  }

  const pendingForms = allForms.filter((f) => f.status === 'PENDING')
  const submittedForms = allForms.filter((f) => f.status === 'SUBMITTED')

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-extrabold text-ink text-lg">Danışan Formları</h3>
        <p className="text-sm text-muted mt-0.5">
          Danışanlarınıza uygunluk bilgilerini toplamak için özel bir link oluşturun ve yanıtları takip edin.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h4 className="font-bold text-ink">Danışan Uygunluk Formu</h4>
          <button type="button" onClick={handleCreateLink}
            className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Yeni Form Linki Oluştur
          </button>
        </div>
        <p className="text-sm text-muted mb-3">Danışana özel bir link oluşturup uygunluk bilgilerini toplayabilirsiniz.</p>

        {formLink && (
          <div className="bg-panel rounded-xl p-3 flex items-center gap-2">
            <a
              className="text-brand-light font-semibold text-sm truncate flex-1 min-w-0"
              href={formLink.publicUrl} target="_blank" rel="noreferrer"
              title={fullLinkUrl}
            >
              {fullLinkUrl}
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-white shrink-0 transition-colors"
            >
              {linkCopied ? 'Kopyalandı ✓' : 'Kopyala'}
            </button>
          </div>
        )}

        <div className="mt-5">
          <h4 className="text-sm font-bold text-ink mb-2">Bekleyen Formlar ({pendingForms.length})</h4>
          {pendingForms.length === 0 ? (
            <EmptyState text="Bekleyen form yok." icon="📝" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingForms.map((f) => (
                <div key={f.id} className="text-xs bg-panel rounded-lg px-3 py-2 flex justify-between">
                  <span>{f.clientFullName || 'Yeni danışan bekleniyor'}</span>
                  <span className="text-amber-700 font-semibold">Yanıt bekleniyor</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {submittedForms.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-bold text-ink mb-2">Yanıtlanan Formlar ({submittedForms.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {submittedForms.map((f) => (
                <div key={f.id} className="text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-ink">{f.clientFullName || 'İsim belirtilmedi'}</span>
                    <span className="text-green-700 font-semibold">Yanıtlandı</span>
                  </div>
                  {f.preferredDays && <div className="text-muted">Uygun günler: {f.preferredDays}</div>}
                  {f.preferredTimeRange && <div className="text-muted">Uygun saat: {f.preferredTimeRange}</div>}
                  {f.notes && <div className="text-muted">Not: {f.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
