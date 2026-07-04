import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
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

// V2.2C: Danışan not defterindeki bir nota tıklanınca açılan detay modalı.
// Aynı modal içinde "Düzenle" ile inline düzenleme moduna geçilebilir.
// Bu notlar KLİNİK/TERAPİ notu değildir — sadece manuel hatırlatma defteridir,
// hiçbir AI analizi/yorum içermez.
export default function ClientNoteDetailModal({ clientId, note, onClose, onSaved, onDeleted }) {
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [displayNote, setDisplayNote] = useState(note)
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    category: note?.category || '',
    pinned: !!note?.pinned,
  })

  if (!note) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.content.trim()) {
      setError('Not içeriği boş olamaz.')
      return
    }
    setSaving(true)
    try {
      const res = await api.put(`/clients/${clientId}/notes/${note.id}`, {
        title: form.title.trim() || null,
        content: form.content.trim(),
        category: form.category || null,
        pinned: form.pinned,
      })
      setDisplayNote(res.data || { ...displayNote, ...form, content: form.content.trim(), title: form.title.trim() || null })
      showToast('Not güncellendi.')
      setEditing(false)
      onSaved()
    } catch (err) {
      showToast(err.response?.data?.message || 'Not kaydedilemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return
    setDeleting(true)
    try {
      await api.delete(`/clients/${clientId}/notes/${note.id}`)
      showToast('Not silindi.')
      onDeleted()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message || 'Not silinemedi.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {!editing ? (
          <>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-extrabold text-lg text-ink break-words">{displayNote.title || 'Not'}</h3>
              {displayNote.pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-soft text-brand-dark shrink-0">📌 Sabit</span>}
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {displayNote.category && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLIENT_NOTE_CATEGORY_STYLES[displayNote.category] || 'bg-gray-200 text-gray-700'}`}>
                  {clientNoteCategoryLabel(displayNote.category)}
                </span>
              )}
              <span className="text-[11px] text-muted">{formatDateTime(displayNote.updatedAt || displayNote.createdAt)}</span>
            </div>

            <p className="text-sm text-ink whitespace-pre-wrap break-words mb-5">{displayNote.content}</p>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={deleting}
                className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors">
                Kapat
              </button>
              <button type="button" onClick={() => setEditing(true)} disabled={deleting}
                className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors">
                Düzenle
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <h3 className="font-extrabold text-lg mb-1 text-ink">Notu Düzenle</h3>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Başlık</label>
              <input type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="Opsiyonel"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Kategori</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm">
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">İçerik *</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={5} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" name="pinned" checked={form.pinned} onChange={handleChange} />
              Sabitle
            </label>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} disabled={saving}
                className="flex-1 border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-panel disabled:opacity-60 transition-colors">
                Vazgeç
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60 transition-colors">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
