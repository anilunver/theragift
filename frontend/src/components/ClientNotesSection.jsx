import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from './EmptyState.jsx'
import ClientNoteDetailModal from './ClientNoteDetailModal.jsx'
import {
  CLIENT_NOTE_CATEGORY_STYLES,
  clientNoteCategoryLabel,
  formatDateTime,
} from '../utils/format.js'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Kategori seçilmedi' },
  { value: 'GENERAL', label: 'Genel Not' },
  { value: 'SESSION', label: 'Seans Notu' },
  { value: 'PAYMENT', label: 'Ödeme Notu' },
  { value: 'AVAILABILITY', label: 'Uygunluk Notu' },
  { value: 'REMINDER', label: 'Hatırlatma' },
  { value: 'OTHER', label: 'Diğer' },
]

const EMPTY_FORM = { title: '', content: '', category: '', pinned: false }

function previewText(content) {
  if (!content) return ''
  const lines = content.split('\n').slice(0, 2).join(' ')
  return lines.length > 160 ? `${lines.slice(0, 160)}…` : lines
}

// V2.2C: Danışan "hafızası" / not defteri. Bu bölüm KLİNİK/TERAPİ notu
// tutmak için değildir — psikoloğun danışanla ilgili ödeme alışkanlığı, seans
// sonrası hatırlatma, uygunluk bilgisi gibi MANUEL notları için kullanılır.
// AI analizi, teşhis, risk/kriz yorumu asla eklenmez. Notlar sadece bu
// danışanın psikoloğuna görünür.
export default function ClientNotesSection({ client }) {
  const { showToast } = useToast()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [detailNote, setDetailNote] = useState(null)

  const loadNotes = () => {
    setLoading(true)
    api.get(`/clients/${client.id}/notes`)
      .then((res) => setNotes(Array.isArray(res.data) ? res.data : []))
      .catch(() => showToast('Notlar yüklenemedi.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadNotes() }, [client.id])

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setSaving(true)
    try {
      await api.post(`/clients/${client.id}/notes`, {
        title: form.title.trim() || null,
        content: form.content.trim(),
        category: form.category || null,
        pinned: form.pinned,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadNotes()
      showToast('Not eklendi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Not kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const pinnedNote = notes.find((n) => n.pinned)

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-extrabold text-ink">Danışan Not Defteri</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand hover:bg-brand-light text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors"
        >
          {showForm ? 'Vazgeç' : '+ Not Ekle'}
        </button>
      </div>
      <p className="text-xs text-muted mb-3">
        {notes.length} not · Bu klinik/terapi notu değildir, sadece manuel hatırlatma defteridir.
      </p>

      {pinnedNote && !showForm && (
        <div className="mb-4 bg-brand-soft border border-brand/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-brand-dark">📌 Sabit Not</span>
            {pinnedNote.category && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLIENT_NOTE_CATEGORY_STYLES[pinnedNote.category] || 'bg-gray-200 text-gray-700'}`}>
                {clientNoteCategoryLabel(pinnedNote.category)}
              </span>
            )}
          </div>
          <button type="button" onClick={() => setDetailNote(pinnedNote)} className="text-left w-full">
            {pinnedNote.title && <div className="text-sm font-semibold text-ink">{pinnedNote.title}</div>}
            <div className="text-xs text-brand-dark line-clamp-2">{previewText(pinnedNote.content)}</div>
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 mb-4 border border-border rounded-xl p-3">
          <input
            type="text" name="title" value={form.title} onChange={handleFormChange}
            placeholder="Başlık (opsiyonel)"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
          <select name="category" value={form.category} onChange={handleFormChange}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <textarea
            name="content" value={form.content} onChange={handleFormChange} rows={3} required
            placeholder="Örn: Ödemeyi genelde ay sonunda yapıyor."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input type="checkbox" name="pinned" checked={form.pinned} onChange={handleFormChange} />
            Sabitle
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} disabled={saving}
              className="flex-1 border border-border rounded-lg py-2 font-semibold text-xs hover:bg-panel disabled:opacity-60 transition-colors">
              Vazgeç
            </button>
            <button type="submit" disabled={saving || !form.content.trim()}
              className="flex-1 bg-brand hover:bg-brand-light text-white rounded-lg py-2 font-bold text-xs disabled:opacity-50 transition-colors">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : notes.length === 0 ? (
        <EmptyState text="Bu danışan için henüz not eklenmemiş." icon="📝" />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setDetailNote(n)}
              className="w-full text-left border border-border rounded-xl px-3 py-2.5 hover:bg-panel transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {n.pinned && <span className="text-[10px]">📌</span>}
                {n.title && <span className="text-sm font-semibold text-ink truncate">{n.title}</span>}
                {n.category && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLIENT_NOTE_CATEGORY_STYLES[n.category] || 'bg-gray-200 text-gray-700'}`}>
                    {clientNoteCategoryLabel(n.category)}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink line-clamp-2 break-words">{previewText(n.content)}</p>
              <p className="text-[11px] text-muted mt-1">{formatDateTime(n.updatedAt || n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}

      {detailNote && (
        <ClientNoteDetailModal
          clientId={client.id}
          note={detailNote}
          onClose={() => setDetailNote(null)}
          onSaved={loadNotes}
          onDeleted={loadNotes}
        />
      )}
    </div>
  )
}
