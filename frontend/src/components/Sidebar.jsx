import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/calendar', label: 'Takvim', icon: '📅' },
  { to: '/clients', label: 'Danışanlar', icon: '👥' },
  { to: '/payments', label: 'Ödemeler', icon: '💳' },
  { to: '/suggestions', label: 'Öneriler', icon: '✨' },
  { to: '/settings', label: 'Ayarlar', icon: '⚙️' },
]

export default function Sidebar({ onNavigate }) {
  return (
    <div className="bg-brand-dark text-white h-full flex flex-col w-64 shrink-0">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="text-xl font-extrabold tracking-tight">TheraGift</div>
        <div className="text-xs text-brand-mint/70 mt-1">Psikolog Paneli · Web MVP</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-brand-dark shadow-sm'
                  : 'text-brand-mint/90 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-base leading-none">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-[11px] text-brand-mint/60 border-t border-white/10">
        © {new Date().getFullYear()} TheraGift — MVP v1
      </div>
    </div>
  )
}
