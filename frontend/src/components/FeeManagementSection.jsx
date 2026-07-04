import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency } from '../utils/format.js'

// V2.2D: Ayarlar sayfasındaki "Ücret Yönetimi" (toplu zam) bölümü.
// Sadece client.defaultSessionFee ve PsychologistProfile.defaultSessionFee günceller.
// Geçmiş randevu ücretlerine (Appointment.sessionFee) ASLA dokunmaz.
export default function FeeManagementSection({ profile, onApplied }) {
  const { showToast } = useToast()
  const [newFee, setNewFee] = useState('')
  const [targetMode, setTargetMode] = useState('ALL_ACTIVE')
  const [clients, setClients] = useState([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [selectedClientIds, setSelectedClientIds] = useState([])
  const [preview, setPreview] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [applying, setApplying] = useState(false)

  const loadClientsIfNeeded = async () => {
    if (clientsLoaded) return
    try {
      const res = await api.get('/clients')
      setClients(Array.isArray(res.data) ? res.data : [])
      setClientsLoaded(true)
    } catch {
      showToast('Danışan listesi yüklenemedi.', 'error')
    }
  }

  const handleTargetModeChange = async (mode) => {
    setTargetMode(mode)
    setPreview(null)
    if (mode === 'MANUAL') await loadClientsIfNeeded()
  }

  const toggleClientId = (id) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const buildRequest = () => ({
    newFee: Number(newFee),
    targetMode,
    clientIds: targetMode === 'MANUAL' ? selectedClientIds : undefined,
  })

  const handlePreview = async (e) => {
    e.preventDefault()
    if (!newFee || Number(newFee) < 0) {
      showToast('Geçerli bir ücret giriniz.', 'error')
      return
    }
    if (targetMode === 'MANUAL' && selectedClientIds.length === 0) {
      showToast('Manuel seçim için en az bir danışan seçin.', 'error')
      return
    }
    setPreviewing(true)
    try {
      const res = await api.post('/practice-settings/update-fees-preview', buildRequest())
      setPreview(res.data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Önizleme oluşturulamadı.', 'error')
    } finally {
      setPreviewing(false)
    }
  }

  const handleApply = async () => {
    if (!preview) return
    if (!window.confirm(`${preview.affectedCount} danışanın varsayılan ücreti ${formatCurrency(preview.newFee)} olarak güncellenecek. Emin misiniz?`)) return
    setApplying(true)
    try {
      await api.post('/practice-settings/apply-fee-update', buildRequest())
      showToast('Ücret güncellemesi tamamlandı.')
      setPreview(null)
      setNewFee('')
      setSelectedClientIds([])
      onApplied && onApplied()
    } catch (err) {
      showToast(err.response?.data?.message || 'Ücret güncellemesi uygulanamadı.', 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-extrabold text-ink mb-1">Ücret Yönetimi</h3>
      <p className="text-sm text-muted mb-4">
        Danışanların varsayılan seans ücretini toplu olarak güncelleyin. Bu işlem sadece yeni
        oluşturulacak randevuları etkiler; geçmiş randevu ücretleri değişmez.
      </p>

      <form onSubmit={handlePreview} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={newFee}
            onChange={(e) => { setNewFee(e.target.value); setPreview(null) }}
            placeholder={`Yeni Varsayılan Ücret${profile?.defaultSessionFee ? ` (şu an ${formatCurrency(profile.defaultSessionFee)})` : ''}`}
            className="border border-border rounded-xl px-3 py-2.5 text-sm"
          />
          <select
            value={targetMode}
            onChange={(e) => handleTargetModeChange(e.target.value)}
            className="border border-border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="ALL_ACTIVE">Tüm aktif danışanlar</option>
            <option value="EQUAL_TO_OLD">Sadece mevcut varsayılan ücrete sahip olanlar</option>
            <option value="MANUAL">Manuel seçim</option>
          </select>
        </div>

        {targetMode === 'MANUAL' && (
          <div className="border border-border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
            {clients.length === 0 ? (
              <div className="text-xs text-muted">Danışan bulunamadı.</div>
            ) : (
              clients.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClientIds.includes(c.id)}
                    onChange={() => toggleClientId(c.id)}
                  />
                  <span className={c.active ? '' : 'text-muted line-through'}>
                    {c.firstName} {c.lastName}
                  </span>
                </label>
              ))
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={previewing}
          className="bg-panel hover:bg-border text-ink font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors border border-border"
        >
          {previewing ? 'Önizleniyor...' : 'Önizleme Yap'}
        </button>
      </form>

      {preview && (
        <div className="mt-4 border border-border rounded-xl p-4 bg-panel">
          <div className="text-sm font-bold text-ink mb-2">
            {preview.affectedCount} danışan etkilenecek: {formatCurrency(preview.oldDefaultFee)} → {formatCurrency(preview.newFee)}
          </div>
          {preview.clients.length === 0 ? (
            <div className="text-xs text-muted">Bu kritere uyan danışan yok.</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
              {preview.clients.map((c) => (
                <div key={c.clientId} className="flex justify-between text-xs bg-white rounded-lg px-3 py-1.5">
                  <span className="text-ink font-semibold">{c.clientFullName}</span>
                  <span className="text-muted">{formatCurrency(c.oldFee)} → {formatCurrency(c.newFee)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleApply}
            disabled={applying || preview.affectedCount === 0}
            className="bg-brand hover:bg-brand-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors"
          >
            {applying ? 'Uygulanıyor...' : 'Ücret Güncellemesini Uygula'}
          </button>
        </div>
      )}
    </div>
  )
}
