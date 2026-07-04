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
    <div className="bg-brand-dark text-white h-full flex flex-col w-56 shrink-0">
      <div className="px-5 py-6">
        <div className="text-xl font-extrabold">TheraGift</div>
        <div className="text-xs text-brand-mint/80 mt-1">Web MVP</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-light text-white'
                  : 'text-brand-mint/90 hover:bg-brand-light/60 hover:text-white'
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-[11px] text-brand-mint/70 border-t border-white/10">
        © {new Date().getFullYear()} TheraGift
      </div>
    </div>
  )
}
