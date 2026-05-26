import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, Leaf, X } from 'lucide-react'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users,           label: 'Client Database' },
]

export default function Sidebar({ open, onClose, onLogout, user }) {
  const initials = user?.email?.charAt(0).toUpperCase() || 'B'
  const email    = user?.email || 'balas@nmbnow.com'

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-forest-700 z-30 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-6 py-7 border-b border-forest-600/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center shadow-sm">
              <Leaf size={15} className="text-cream-50" />
            </div>
            <div>
              <p className="font-display text-cream-50 text-lg leading-none">Revival</p>
              <p className="text-forest-400 text-xs mt-0.5">Client Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-forest-400 hover:text-cream-50 p-1">
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-forest-500/60 text-cream-50' : 'text-forest-300 hover:bg-forest-600/40 hover:text-cream-50'}`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-5 border-t border-forest-600/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-forest-500 flex items-center justify-center text-cream-50 font-display text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-cream-50 truncate">Benjamin Alas</p>
              <p className="text-xs text-forest-400 truncate">{email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-forest-400 hover:text-cream-50 hover:bg-forest-600/40 transition-all">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
