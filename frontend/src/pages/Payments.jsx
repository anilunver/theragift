import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx'
import PaymentUpdateModal from '../components/PaymentUpdateModal.jsx'
import StatCard from '../components/StatCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatCurrency, formatDate, toTitleCase, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format.js'

const TABS = [
  { key: 'all', label: 'Tüm Seanslar', endpoint: '/appointments', empty: 'Henüz randevu kaydı yok.' },
  { key: 'toCollect', label: 'Tahsil Edilecek', endpoint: '/payments/to-collect', empty: 'Tahsil edilecek ödeme yok.' },
  { key: 'overdue', label: 'Geciken', endpoint: '/payments/overdue', empty: 'Geciken ödeme yok.' },
  { key: 'partial', label: 'Kısmi Ödenen', endpoint: '/payments/partial', empty: 'Kısmi ödenen seans yok.' },
  { key: 'paid', label: 'Ödenenler', endpoint: '/payments/paid', empty: 'Henüz ödenmiş seans yok.' },
  { key: 'packageFree', label: 'Paket / Ücretsiz', endpoint: '/payments/package-free', empty: 'Paket veya ücretsiz seans yok.' },
  { key: 'cancelled', label: 'İptal Edilenler', endpoint: '/payments/cancelled', empty: 'İptal edilmiş randevu yok.' },
  { key: 'noShow', label: 'Gelmeyenler', endpoint: '/payments/no-show', empty: 'Gelinmeyen randevu yok.' },
]

const SORT_OPTIONS = [
  { key: 'dateDesc', label: 'En yeni' },
  { key: 'dateAsc', label: 'En eski' },
  { key: 'remainingDesc', label: 'En yüksek borç' },
  { key: 'paidDesc', label: 'En yüksek ödeme' },
]

const EMPTY_FILTERS = {
  search: '',
  dateFrom: '',
  dateTo: '',
  paymentStatus: '',
  paymentMethod: '',
  minFee: '',
  maxFee: '',
}

export default function Payments() {
  const [tab, setTab] = useState('toCollect')
  const [items, setItems] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('dateDesc')
  const [showFilters, setShowFilters] = useState(false)

  const activeTab = TABS.find((t) => t.key === tab)

  // V2.2D bugfix: Sekmeler hızlıca değiştirildiğinde önceki sekmenin isteği
  // (örn. "Tahsil Edilecek") yeni sekmenin isteğinden (örn. "İptal Edilenler")
  // SONRA dönebiliyordu — bu durumda eski/yanlış sekmenin verisi state'e
  // yazılıyor ve "İptal Edilenler" gibi sekmelerde geçici olarak iptal
  // olmayan kayıtlar görünüyordu (race condition). Her isteğin hangi sekme
  // için atıldığını bir ref'te tutup, sadece HÂLÂ GÜNCEL olan sekmenin
  // cevabı state'e yazılarak bu düzeltilir.
  const requestedTabRef = useRef(tab)

  const loadTab = () => {
    const requestedTab = tab
    requestedTabRef.current = requestedTab
    setLoading(true)
    setError('')
    // V2.2D.1: Sekme değişir değişmez önceki sekmenin verisi ekrandan temizlenir —
    // "loading" göstergesi zaten eski veriyi gizliyordu ama bu ek bir güvenlik katmanı:
    // yeni istek dönene kadar state'te asla başka bir sekmenin kayıtları kalmaz.
    setItems([])
    api.get(activeTab.endpoint)
      .then((res) => {
        if (requestedTabRef.current !== requestedTab) return // eski/artık geçersiz istek — yok say
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (requestedTabRef.current !== requestedTab) return
        setError('Ödeme verileri yüklenemedi.')
      })
      .finally(() => {
        if (requestedTabRef.current !== requestedTab) return
        setLoading(false)
      })
  }

  const loadMonthly = () => {
    api.get('/payments/monthly-summary').then((res) => setMonthly(res.data))
  }

  useEffect(() => { loadTab() }, [tab])
  useEffect(() => { loadMonthly() }, [])

  const handleUpdated = () => {
    loadTab()
    loadMonthly()
  }

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })

  // F