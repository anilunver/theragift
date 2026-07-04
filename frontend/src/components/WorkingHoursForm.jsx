import { useState } from 'react'
import api from '../api/axios.js'

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
  const [form, setForm] = useState({
    dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00',
    breakStartTime: '12:00', breakEndTime: '13:00',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/working-hours', form)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await api.delete(`/working-hours/${id}`)
    onChanged()
  }

  const handleToggleActive = async (wh) => {
    await api.put(`/working-hours/${wh.id}`, { active: !wh.active })
    onChanged()
  }

  const dayLabel = (value) => DAYS.find((d) => d.value === value)?.label || value

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {workingHours.length === 0 && <div className="text-sm text-muted">Henüz çalışma saati eklenmemiş.</div>}
        {workingHours.map((wh) => (
          <div key={wh.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-2.5">
            <div>
              <div className="text-sm font-semibold text-ink">{dayLabel(wh.dayOfWeek)}</div>
              <div className="text-xs text-muted">
                {wh.startTime} - {wh.endTime}
                {wh.breakStartTime && ` · Mola: ${wh.breakStartTime}-${wh.breakEndTime}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggleActive(wh)}
                className={`text-xs font-semibold px-2 py-1 rounded-full ${wh.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {wh.active ? 'Aktif' : 'Pasif'}
              </button>
              <button onClick={() => handleDelete(wh.id)} className="text-xs font-semibold text-red-600">Sil</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="border-t border-border pt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm col-span-2 md:col-span-1">
          {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
        <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
        <input type="time" name="breakStartTime" value={form.breakStartTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm" />
        <div className="flex gap-1">
          <input type="time" name="breakEndTime" value={form.breakEndTime} onChange={handleChange} className="border border-border rounded-xl px-2 py-2 text-sm flex-1" />
          <button type="submit" disabled={saving} className="bg-brand hover:bg-brand-light text-white rounded-xl px-3 text-sm font-bold disabled:opacity-60">+</button>
        </div>
      </form>
    </div>
  )
}
