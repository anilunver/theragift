import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import SuggestionCard from '../components/SuggestionCard.jsx'

export default function Suggestions() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data))
  }, [])

  const fetchSuggestions = async (id) => {
    if (!id) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/suggestions/client/${id}`)
      setSuggestions(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleUse = (suggestion) => {
    navigate('/appointments/new', {
      state: {
        clientId: Number(clientId),
        prefillDate: suggestion.date,
        prefillStart: suggestion.startTime,
        prefillEnd: suggestion.endTime,
      },
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-ink">Randevu Önerileri</h2>
        <p className="text-sm text-muted">Danışan seçin, algoritma çalışma saatlerine ve uygunluğa göre en iyi 3 slotu önersin.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 flex gap-3 items-center">
        <select
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); fetchSuggestions(e.target.value) }}
          className="border border-border rounded-xl px-3 py-2.5 text-sm flex-1"
        >
          <option value="">Danışan seçiniz</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-muted">Öneriler hesaplanıyor...</div>}

      {!loading && searched && suggestions.length === 0 && (
        <div className="text-sm text-muted bg-white border border-border rounded-2xl p-6 text-center">
          Uygun boş slot bulunamadı. Çalışma saatlerini kontrol edin.
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((s, idx) => (
            <SuggestionCard key={idx} suggestion={s} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  )
}
