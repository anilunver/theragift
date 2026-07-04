import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from './EmptyState.jsx'
import {
  dayOfWeekLabel, recurrenceTypeLabel, formatCurrency, formatDate, formatTime,
} from '../utils/format.js'

const EMPTY_FORM = {
  dayOfWeek: 'MONDAY',
  startTime: '10:00',
  endTime: '10:50',
  sessionType: 'ONLINE',
  feeAmount: '',
  paymentStatusDefault: 'UNPAID',
  recurrenceType: 'WEEKLY',
  note: '',
}

// Danışan detayındaki "Sabit Randevu" bölümü. Sabit randevu kuralları burada
// oluşturulur/listelenir; "Önümüzdeki 4 hafta randevuları oluştur" butonu bu
// kurala göre gerçek Appointment kayıtları üretir (backend merkezi çakışma
// kontrolünden geçer) — üretilen randevular otomatik olarak takvimde görünür.
export default function RecurringAppointmentSection({ client }) {
  const { showToast } = useToast()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [generatingId, setGeneratingId] = useState(null)
  const [generateResult, setGenerateResult] = useState(null)

  const loadRules = () => {
    setLoading(true)
    api.get('/recurring-appointments', { params: { clientId: client.id } })
      .then((res) => setRules(res.data))
      .catch(() => showToast('Sabit randevular yüklenemedi.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRules() }, [client.id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.startTime >= form.endTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.')
      return
    }
    setSaving(true)
    try {
      await api.post('/recurring-appointments', {
        ...form,
        clientId: client.id,
        feeAmount: form.feeAmount ? Number(form.feeAmount) : null,
      })
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadRules()
      showToast('Sabit randevu kuralı oluşturuldu.')
    } catch (err) {
      setError(err.response?.data?.message || 'Sabit randevu kuralı oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (rule) => {
    try {
      await api.put(`/recurring-appointments/${rule.id}`, { active: !rule.active })
      loadRules()
      showToast(rule.active ? 'Kural pasif hale getirildi.' : 'Kural aktif hale getirildi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Kural güncellenemedi.', 'error')
    }
  }

  const handleDelete = async (rule) => {
    if (!window.confirm('Bu sabit randevu kuralını silmek istediğinize emin misiniz? (Daha önce oluşturulmuş randevular silinmez.)')) return
    try {
      await api.delete(`/recurring-appointments/${rule.id}`)
      loadRules()
      showToast('Sabit randevu kuralı silindi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Kural silinemedi.', 'error')
    }
  }

  const handleGenerate = async (rule) => {
    setGeneratingId(rule.id)
    setGenerateResult(null)
    try {
      const res = await api.post(`/recurring-appointments/${rule.id}/generate`)
      setGenerateResult({ ruleId: rule.id, ...res.data })
      showToast(`${res.data.createdCount} randevu oluşturuldu${res.data.skippedCount > 0 ? `, ${res.data.skippedCount} tanesi çakışma nedeniyle atlandı` : ''}.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Randevular oluşturulamadı.', 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-ink">Sabit Randevu</h3>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowForm(!showForm) }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors"
        >
          {showForm ? 'Vazgeç' : '+ Yeni Kural'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-5 bg-panel rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Gün</label>
              <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((d) => (
                  <option key={d} value={d}>{dayOfWeekLabel(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Tekrar Sıklığı</label>
              <select name="recurrenceType" value={form.recurrenceType} onChange={handleChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
                <option value="WEEKLY">Her hafta</option>
                <option value="BIWEEKLY">İki haftada bir</option>
                <option value="MONTHLY">Ayda bir</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Başlangıç Saati</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Bitiş Saati</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Seans Türü</label>
              <select name="sessionType" value={form.sessionType} onChange={handleChange}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
                <option value="ONLINE">Online</option>
                <option value="FACE_TO_FACE">Yüz Yüze</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">Ücret (₺)</label>
              <input type="number" name="feeAmount" value={form.feeAmount} onChange={handleChange}
                placeholder="Danışanın varsayılan ücreti kullanılır"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">Varsayılan Ödeme Durumu</label>
            <select name="paymentStatusDefault" value={form.paymentStatusDefault} onChange={handleChange}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm">
              <option value="UNPAID">Ödenmedi</option>
              <option value="PAY_LATER">Sonra Ödenecek</option>
              <option value="PACKAGE_USED">Paketten Düşüldü</option>
              <option value="FREE">Ücretsiz</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">Not</label>
            <input name="note" value={form.note} onChange={handleChange}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm" />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={saving}
            className="w-full bg-brand hover:bg-brand-light text-white rounded-lg py-2 font-bold text-sm disabled:opacity-60 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Kuralı Kaydet'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : rules.length === 0 ? (
        <EmptyState text="Bu danışan için sabit randevu tanımlanmamış." icon="🔁" />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="border border-border rounded-xl p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm font-bold text-ink">
                    {dayOfWeekLabel(rule.dayOfWeek)} · {formatTime(rule.startTime)} - {formatTime(rule.endTime)}
                  </div>
                  <div className="text-xs text-muted">
                    {recurrenceTypeLabel(rule.recurrenceType)} · {formatCurrency(rule.feeAmount)}
                    {!rule.active && <span className="ml-2 text-red-600 font-semibold">Pasif</span>}
                  </div>
                  {rule.note && <div className="text-xs text-muted mt-1">{rule.note}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleGenerate(rule)}
                    disabled={!rule.active || generatingId === rule.id}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-soft text-brand-dark hover:bg-brand/20 disabled:opacity-50 transition-colors"
                  >
                    {generatingId === rule.id ? 'Oluşturuluyor...' : 'Önümüzdeki 4 hafta'}
                  </button>
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-panel transition-colors"
                  >
                    {rule.active ? 'Pasif yap' : 'Aktif yap'}
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {generateResult && generateResult.ruleId === rule.id && (
                <div className="mt-3 pt-3 border-t border-border/70 text-xs space-y-1.5">
                  <div className="font-semibold text-green-700">{generateResult.createdCount} randevu oluşturuldu.</div>
                  {generateResult.skipped.length > 0 && (
                    <div>
                      <div className="font-semibold text-amber-700">{generateResult.skipped.length} slot çakışma nedeniyle atlandı:</div>
                      <ul className="list-disc list-inside text-muted">
                        {generateResult.skipped.map((s, idx) => (
                          <li key={idx}>{formatDate(s.date)} {formatTime(s.startTime)} - {s.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {generateResult.warnings.length > 0 && (
                    <div>
                      <div className="font-semibold text-purple-700">Bilgilendirme:</div>
                      <ul className="list-disc list-inside text-muted">
                        {generateResult.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
