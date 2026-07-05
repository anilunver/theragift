import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" className="md:hidden text-2xl shrink-0" onClick={onMenuClick} aria-label="Menü">
          ☰
        </button>
        <h1 className="text-lg md:text-xl font-extrabold text-ink truncate">{title}</h1>
        {/* V2.4: Ürünün pilot/MVP aşamasında olduğunu net ama rahatsız etmeden
            gösteren küçük bir rozet. Herhangi bir veri silme/reset işlevi yok,
            sadece görsel bir açıklık notu. */}
        <span
          className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0"
          title="TheraGift şu anda pilot/MVP aşamasındadır"
        >
          Pilot MVP
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-ink leading-tight">{user?.fullName}</div>
          <div className="text-xs text-muted leading-tight">{user?.email}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-semibold px-3 py-2 rounded-lg border border-border hover:bg-panel transition-colors"
        >
          Çıkış
        </button>
      </div>
    </div>
  )
}
