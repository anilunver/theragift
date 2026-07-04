import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from './EmptyState.jsx'

// Danışan operasyonel notları. Bilinçli olarak basit — klinik/terapi notu
// DEĞİLDİR (örn. "Ödemeyi genelde ay sonunda yapıyor.", "Online seansı tercih ediyor.").
export default function ClientNotesSection({ client }) {
  const { showToast } = useToast()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const loadNotes = () => {
    setLoading(true)
    api.get(`/clients/${client.id}/notes`)
      .then((res) => setNotes(res.data))
      .catch(() => showToast('Notlar yüklenemedi.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadNotes() }, [client.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await api.post(`/clients/${client.id}/notes`, { note: newNote.trim() })
      setNewNote('')
      loadNotes()
      showToast('Not eklendi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Not eklenemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/clients/${client.id}/notes/${noteId}`)
      loadNotes()
      showToast('Not silindi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Not silinemedi.', 'error')
    }
  }

  const formatNoteDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-extrabold text-ink mb-4">Notlar</h3>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Örn: Ödemeyi genelde ay sonunda yapıyor."
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
        />
        <button type="submit" disabled={saving || !newNote.trim()}
          className="bg-brand hover:bg-brand-light text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-colors">
          Ekle
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : notes.length === 0 ? (
        <EmptyState text="Bu danışan için henüz not eklenmemiş." icon="📝" />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 border border-border rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-ink">{n.note}</p>
                <p className="text-[11px] text-muted mt-1">{formatNoteDate(n.createdAt)}</p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="text-xs font-semibold text-red-600 hover:underline shrink-0"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
