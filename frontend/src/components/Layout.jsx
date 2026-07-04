import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const titles = {
  '/dashboard': 'Dashboard Genel Bakış',
  '/clients': 'Danışanlar',
  '/calendar': 'Haftalık Takvim',
  '/appointments/new': 'Yeni Randevu',
  '/suggestions': 'Randevu Önerileri',
  '/payments': 'Ödeme Takibi',
  '/reports': 'Raporlar',
  '/settings': 'Ayarlar',
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path))?.[1]
    || 'TheraGift'

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Masaüstü sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobil sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
    