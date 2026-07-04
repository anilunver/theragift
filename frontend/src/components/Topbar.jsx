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
    <div className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-2xl" onClick={onMenuClick} aria-label="Menü">
          ☰
        </button>
        <h1 className="text-lg md:text-xl font-extrabold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-ink">{user?.fullName}</div>
          <div className="text-xs text-muted">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold px-3 py-2 rounded-lg border border-border hover:bg-panel"
        >
          Çıkış
        </button>
      </div>
    </div>
  )
}
