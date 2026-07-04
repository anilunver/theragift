import { useState } from 'react'
import api from '../api/axios.js'
import { useToast } from '../context/ToastContext.jsx'
import { dayOfWeekLabel, dayOfWeekOrder, formatTime } from '../utils/format.js'
import EmptyState from './EmptyState.jsx'

const DAYS = [
  { value: 'MONDAY', label: 'Pazartesi' },
  { value: 'TUESDAY', label: 'Salı' },
  { value: 'WEDNESDAY', label: 'Çarşamba' },
  { value: 'THURSDAY', label: 'Perşembe' },
  { value: 'FRIDAY', label: 'Cuma' },
  { value: 'SATURDAY', label: 'Cumartesi' },
  { value: 'SUNDAY', label: 'Pazar' },
]

export default function WorkingHoursForm({ workingHours, onChanged }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00',
    breakStartTime: '12:00', breakEndTime: '13:00',
  })
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleAdd = async (e) => {
    e.preventDefault()
    setWarning('')

    const duplicate = workingHours.some((wh) => wh.dayOfWeek === form.dayOfWeek && wh.active)
    if (duplicate) {
      setWarning(`${dayOfWeekLabel(form.dayOfWeek)} günü için zaten aktif bir çalışma saati var. Önce mevcut kaydı silin veya pasife alın.`)
      return
    }

    setSaving(true)
    try {
      await api.post('/working-hours', form)
      onChanged()
      showToast('Çalışma saati eklendi.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await api.delete(`/working-hours/${id}`)
    onChanged()
    showToast('Çalışma saati silindi.')
  }

  const handleToggleActive = async (wh) => {
    await api.put(`/working-hours/${wh.id}`, { active: !wh.active })
    onChanged()
  }

  const sorted = [...workingHours].sort((a, b) => dayOfWeekOrder(a.dayOfWeek) - dayOfWeekOrder(b.dayOfWeek))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sorted.length === 0 && <EmptyState text="Henüz çalışma saati eklenmemiş." icon="🕘" />}
        {sorted.map((wh) => (
          <div key={wh.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-2.5">
            <div>
              <div className="text-sm font-semibold text-ink">{dayOfWeekLabel(wh.dayOfWeek)}</div>
              <div className="text-xs text-muted">
                {formatTime(wh.startTime)} - {formatTime(wh.endTime)}
                {' · '}
                {wh.breakStartTime ? `Mola: ${formatTime(wh.breakStartTime)}-${formatTime(wh.breakEndTime)}` : 'Mola yok'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggleActive(wh)}
                className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${wh.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                {wh.active ? 'Aktif' : 'Pasif'}
              </button>
              <button onClick={() => handleDelete(wh.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">Sil</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="border-t border-border pt-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm col-span-2 md:col-span-1">
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
          <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
          <input type="time" name="breakStartTime" value={form.breakStartTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
          <div className="flex gap-1">
            <input type="time" name="breakEndTime" value={form.breakEndTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm flex-1" />
            <button type="submit" disabled={saving} className="bg-brand hover:bg-brand-light text-white rounded-xl px-3 text-sm font-bold disabled:opacity-60 transition-colors">+</button>
          </div>
        </div>
        {warning && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warning}</div>}
      </form>
    </div>
  )
}
