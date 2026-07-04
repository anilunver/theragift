import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import SuggestionCard from '../components/SuggestionCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'

export default function Suggestions() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    // V2.2D: Pasif danışanlar öneri listesinde varsayılan olarak gösterilmez.
    api.get('/clients').then((res) => setClients((res.data || []).filter((c) => c.active)))
  }, [])

  const fetchSuggestions = async (id) => {
    setClientId(id)
    setError('')
    if (!id) {
      setSuggestions([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/suggestions/client/${id}`)
      setSuggestions(res.data)
    } catch (err) {
      setError('Öneriler hesaplanamadı. Çalışma saatlerinin tanımlı olduğundan emin olun.')
    } finally {
      setLoading(false)
    }
  }

  const handleUse = (suggestion) => {
    // Backend LocalTime alanlarını "HH:mm:ss" olarak serileştirebilir; <input type="time">
    // ile tutarlı olması için "HH:mm" olacak şekilde kırpıyoruz. Tarih zaten "YYYY-MM-DD"
    // string olarak backend'den geldiği gibi aktarılır — Date objesine hiç çevrilmez,
    // bu yüzden zaman dilimi kaynaklı gün kayması burada oluşmaz.
    navigate('/appointments/new', {
      state: {
        clientId: Number(clientId),
        prefillDate: suggestion.date,
        prefillStart: suggestion.startTime.slice(0, 5),
        prefillEnd: suggestion.endTime.slice(0, 5),
      },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Randevu Önerileri"
        description="Danışan seçin, algoritma çalışma saatlerine ve uygunluğa göre en iyi 3 slotu önersin."
      />

      <div className="bg-white border border-border rounded-2xl p-4 flex gap-3 items-center shadow-sm">
        <select
          value={clientId}
          onChange={(e) => fetchSuggestions(e.target.value)}
          className="border border-border rounded-xl px-3 py-2.5 text-sm flex-1"
        >
          <option value="">Danışan seçiniz</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingState text="Öneriler hesaplanıyor..." />}

      {!loading && error && <ErrorState text={error} />}

      {!loading && !error && searched && suggestions.length === 0 && (
        <EmptyState
          text="Bu danışan için uygun boş slot bulunamadı. Çalışma saatleri, tatil blokları veya danışan uygunluk notunu kontrol edin."
          icon="🔍"
        />
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((s, idx) => (
            <SuggestionCard key={idx} suggestion={s} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  )
}
