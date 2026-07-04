import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import UnavailableBlockFormModal from './UnavailableBlockFormModal.jsx'
import UnavailableBlockDetailModal from './UnavailableBlockDetailModal.jsx'
import EmptyState from './EmptyState.jsx'
import {
  formatDate,
  unavailableBlockTypeLabel,
  UNAVAILABLE_BLOCK_TYPE_STYLES,
  formatTime,
} from '../utils/format.js'

// V2.2B: Ayarlar sayfasındaki "Çalışma Dışı Günler ve Tatil" bölümü.
// Kayıtlı blokları listeler, yeni blok ekleme modalını açar, silme onayı ister.
export default function UnavailableBlocksSection() {
  const { showToast } = useToast()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/unavailable-blocks')
      .then((res) => setBlocks(Array.isArray(res.data) ? res.data : []))
      .catch(() => showToast('Çalışma dışı bloklar yüklenemedi.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e, block) => {
    e.stopPropagation()
    if (!window.confirm(`"${block.title}" bloğunu silmek istediğinize emin misiniz?`)) return
    try {
      await api.delete(`/unavailable-blocks/${block.id}`)
      showToast('Blok silindi.')
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Blok silinemedi.', 'error')
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-extrabold text-ink">Çalışma Dışı Günler ve Tatil</h3>
        <button type="button" onClick={() => setShowForm(true)}
          className="bg-brand hover:bg-brand-light text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors">
          + Yeni Blok Ekle
        </button>
      </div>
      <p className="text-xs text-muted mb-3">
        Bu bloklar mevcut randevuları otomatik iptal etmez; sadece randevu oluşturma, öneriler ve
        sabit randevu üretiminde uyarı olarak dikkate alınır.
      </p>

      {loading ? (
        <div className="text-xs text-muted">Yükleniyor...</div>
      ) : blocks.length === 0 ? (
        <EmptyState text="Henüz çalışma dışı gün/tatil eklenmedi." icon="🏖️" />
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <button
              type="button"
              key={b.id}
              onClick={() => setSelectedBlock(b)}
              className="w-full flex items-center justify-between border border-border rounded-xl px-3 py-2.5 text-left hover:bg-panel transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${UNAVAILABLE_BLOCK_TYPE_STYLES[b.type] || 'bg-gray-200 text-gray-700'}`}>
                    {unavailableBlockTypeLabel(b.type, b.title)}
                  </span>
                  <span className="text-sm font-semibold text-ink truncate">{b.title}</span>
                  {b.affectedAppointmentsCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-700">⚠️ {b.affectedAppointmentsCount} randevu</span>
                  )}
                </div>
                <div className="text-xs text-muted mt-1">
                  {formatDate(b.startDate)}
                  {b.startDate !== b.endDate ? ` - ${formatDate(b.endDate)}` : ''}
                  {b.fullDay ? ' · Tam gün' : ` · ${formatTime(b.startTime)} - ${formatTime(b.endTime)}`}
                </div>
                {b.note && <div className="text-xs te