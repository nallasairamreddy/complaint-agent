import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ListOrdered, Zap } from 'lucide-react'

const nav = [
  { to: '/',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit', icon: PlusCircle,      label: 'Submit'    },
  { to: '/queue',  icon: ListOrdered,     label: 'Queue'     },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-ink-700 flex flex-col bg-ink-900">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-ink-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-signal-blue flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-700 text-white text-sm leading-none">ComplaintAI</p>
              <p className="text-ink-600 text-xs mt-0.5 font-mono">v1.0 · PARL Agent</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200
                ${isActive
                  ? 'bg-signal-blue/15 text-signal-blue border border-signal-blue/30'
                  : 'text-slate-400 hover:text-white hover:bg-ink-700'
                }`
              }
            >
              <Icon size={16} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse-dot" />
            <span className="text-xs text-slate-500 font-mono">API Connected</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
