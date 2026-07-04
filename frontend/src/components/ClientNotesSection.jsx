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
        <h3 className="font-extrabold text-ink flex items-center gap-1.5">📓 Danışan Not Defteri</h3>
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
  