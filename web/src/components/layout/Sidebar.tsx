import { Link, useRouter } from '@tanstack/react-router'
import { useAuth, useClearAuth } from '../../hooks/useAuth'
import { authApi } from '../../api/auth'

const navItems = [
  { label: 'Ask', to: '/ask' },
  { label: 'Documents', to: '/documents' },
  { label: 'History', to: '/history' },
] as const

export function Sidebar() {
  const { user, isAdmin } = useAuth()
  const clearAuth = useClearAuth()
  const router = useRouter()

  async function handleLogout() {
    await authApi.logout()
    clearAuth()
    await router.navigate({ to: '/login' })
  }

  return (
    <aside className="w-60 shrink-0 bg-navy flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center text-white font-bold text-sm">
            O
          </div>
          <span className="text-white font-semibold text-base">OpsIQ</span>
        </div>
        {user && (
          <div className="mt-3 px-2 py-1.5 rounded bg-navy-light text-xs text-gray-400 uppercase tracking-wider">
            {user.tenantName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            aria-current={undefined}
            activeProps={{ 'aria-current': 'page' as const, className: 'bg-navy-light text-white' }}
            inactiveProps={{ className: 'text-gray-400 hover:text-white hover:bg-navy-light' }}
            className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/settings"
            activeProps={{ 'aria-current': 'page' as const, className: 'bg-navy-light text-white' }}
            inactiveProps={{ className: 'text-gray-400 hover:text-white hover:bg-navy-light' }}
            className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Settings
          </Link>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-xs truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  )
}
