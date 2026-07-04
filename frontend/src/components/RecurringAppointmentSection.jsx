import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from './EmptyState.jsx'
import RecurringConfirmModal from './RecurringConfirmModal.jsx'
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

// V2.2A.2: Backend'den gelen generate response'unu HER ZAMAN güvenli bir şekle
// normalize eder. Beklenmeyen/eksik alanlar (null/undefined) sayfayı asla
// çökertmesin diye — array alanları her zaman dizi, sayılar her zaman sayı olur.
const normalizeGenerateResponse = (raw) => ({
  requiresConfirmation: !!raw?.requiresConfirmation,
  createdCount: Number.isFinite(raw?.createdCount) ? raw.createdCount : 0,
  createdAppointments: Array.isArray(raw?.createdAppointments) ? raw.createdAppointments : [],
  blockers: Array.isArray(raw?.blockers) ? raw.blockers : [],
  warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
})

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
  const [lastResult, setLastResult] = useState(null)
  const [confirmState, setConfirmState] = useState(null) // { rule, blockers, warnings }

  const loadRules = () => {
    setLoading(true)
    api.get('/recurring-appointments', { params: { clientId: client.id } })
      .then((res) => setRules(Array.isArray(res.data) ? res.data : []))
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

  // "Pasif yap" SADECE kuralı pasifleştirir — daha önce üretilmiş randevuları
  // otomatik silmez/iptal etmez. Deaktivasyon başarılı olduktan SONRA, ayrı bir
  // opsiyonel adım olarak kullanıcıya "gelecekteki planlı randevuları da iptal
  // etmek ister misin?" diye sorulur. Bu iki adım kasıtlı olarak ayrıdır —
  // pasifleştirme işlemi asla randevu iptaline otomatik bağlı değildir.
  const handleToggleActive = async (e, rule) => {
    e.preventDefault()
    const wasActive = rule.active
    try {
      await api.put(`/recurring-appointments/${rule.id}`, { active: !rule.active })
      loadRules()
      showToast(wasActive ? 'Kural pasif hale getirildi.' : 'Kural aktif hale getirildi.')

      if (wasActive) {
        const wantsCancel = window.confirm(
          'Kural pasifleştirildi. Bu kural yalnızca yeni otomatik üretimi durdurur — ' +
          'daha önce oluşturulmuş randevular takvimde kalır.\n\n' +
          'Bu kurala bağlı, GELECEKTEKİ ve hâlâ planlı (SCHEDULED) randevuları da ' +
          'iptal etmek ister misiniz? (Geçmiş, tamamlanan veya zaten iptal/gelmedi ' +
          'olarak işaretlenmiş randevulara dokunulmaz.)'
        )
        if (wantsCancel) {
          await handleCancelFuture(rule)
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Kural güncellenemedi.', 'error')
    }
  }

  const handleCancelFuture = async (rule) => {
    try {
      const res = await api.post(`/recurring-appointments/${rule.id}/cancel-future`)
      const count = Number.isFinite(res.data?.cancelledCount) ? res.data.cancelledCount : 0
      showToast(`${count} gelecekteki planlı randevu iptal edildi.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Gelecekteki randevular iptal edilemedi.', 'error')
    }
  }

  const handleDelete = async (e, rule) => {
    e.preventDefault()
    if (!window.confirm('Bu sabit randevu kuralını silmek istediğinize emin misiniz? (Daha önce oluşturulmuş randevular silinmez.)')) return
    try {
      await api.delete(`/recurring-appointments/${rule.id}`)
      loadRules()
      showToast('Sabit randevu kuralı silindi.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Kural silinemedi.', 'error')
    }
  }

  // Backend'e ÖNCE overrideWarnings olmadan istek atılır. Eğer warning varsa
  // backend HİÇBİR randevu oluşturmadan requiresConfirmation=true döner — bu
  // durumda kullanıcıya onay modalı gösterilir, randevu oluşturma işlemi
  // kullanıcı "Yine de oluştur" demeden asla gerçekleşmez.
  //
  // V2.2A.2: Bu fonksiyon artık HİÇBİR durumda (çakışma/mesai dışı/uygunluk
  // dışı/başarı) fırlatılmamış bir hata bırakmaz — her adım try/catch içinde,
  // ve backend'den gelen response şekli ne olursa olsun normalizeGenerateResponse
  // ile güvenli hale getirilir.
  const handleGenerate = async (e, rule) => {
    e.preventDefault()
    setGeneratingId(rule.id)
    try {
      const res = await api.post(`/recurring-appointments/${rule.id}/generate`)
      const data = normalizeGenerateResponse(res.data)
      if (data.requiresConfirmation) {
        setConfirmState({ rule, blockers: data.blockers, warnings: data.warnings })
        return
      }
      applyGenerateResult(rule, data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Randevular oluşturulamadı. Lütfen tekrar deneyin.', 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  const applyGenerateResult = (rule, data) => {
    setLastResult({ ruleId: rule.id, ...data })
    loadRules()
    const parts = [`${data.createdCount} randevu oluşturuldu`]
    if (data.blockers.length > 0) parts.push(`${data.blockers.length} slot çakışma nedeniyle engellendi`)
    showToast(parts.join(', ') + '.')
  }

  const handleConfirmGenerate = async () => {
    if (!confirmState?.rule) {
      setConfirmState(null)
      return
    }
    const rule = confirmState.rule
    setGeneratingId(rule.id)
    try {
      const res = await api.post(`/recurring-appointments/${rule.id}/generate`, null, { params: { overrideWarnings: true } })
      const data = normalizeGenerateResponse(res.data)
      setConfirmState(null)
      applyGenerateResult(rule, data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Randevular oluşturulamadı. Lütfen tekrar deneyin.', 'error')
      setConfirmState(null)
    } finally {
      setGeneratingId(null)
    }
  }

  const handleCancelGenerate = () => {
    setConfirmState(null)
    showToast('Randevu oluşturma vazgeçildi, hiçbir randevu oluşturulmadı.')
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-ink">Sabit Randevu</h3>
        <button
          type="button"
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
              className="w-