import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import {
  MessageSquare, FileText, Clock, Settings, LogOut,
} from 'lucide-react'
import { useAuth, useClearAuth } from '../../hooks/useAuth'
import { authApi } from '../../api/auth'

const NAV = [
  { label: 'Ask',       to: '/ask',       Icon: MessageSquare },
  { label: 'Documents', to: '/documents', Icon: FileText },
  { label: 'History',   to: '/history',   Icon: Clock },
] as const

export function Sidebar() {
  const { user, isAdmin } = useAuth()
  const clearAuth = useClearAuth()
  const router = useRouter()
  const pathname = useRouterState({ select: s => s.location.pathname })

  async function handleLogout() {
    await authApi.logout()
    clearAuth()
    await router.navigate({ to: '/login' })
  }

  function active(to: string) {
    return pathname.startsWith(to)
  }

  const initials = (user?.name ?? user?.email ?? '??').slice(0, 2).toUpperCase()

  return (
    <aside
      className="bg-navy text-ink-nav flex flex-col sticky top-0 h-screen"
      style={{ padding: '18px 14px', gap: '4px' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-[10px] px-2 pb-[14px]">
        <div className="w-[30px] h-[30px] rounded-sm bg-accent text-white grid place-items-center font-bold text-base flex-none">
          O
        </div>
        <span className="font-bold text-base text-white tracking-[-0.01em]">OpsIQ</span>
      </div>

      {/* Workspace chip */}
      <div
        className="mx-1 mb-[14px] px-3 py-[10px] rounded-sm bg-navy-pill border border-navy-line"
        style={{ marginTop: '2px' }}
      >
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-nav-2">
          Workspace
        </div>
        <div className="text-body font-semibold text-white mt-[2px]">
          {user?.tenantName ?? 'AcmePay'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[2px]" aria-label="Primary">
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-nav-2 px-[10px] py-[8px]">
          Menu
        </div>

        {NAV.map(({ label, to, Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={active(to) ? 'page' : undefined}
            className={`flex items-center gap-[11px] h-control px-3 rounded-sm font-medium text-body border-none w-full transition-colors ${
              active(to)
                ? 'bg-navy-pill text-white shadow-[inset_0_0_0_1px_#1C2A41]'
                : 'text-ink-nav hover:bg-navy-pill hover:text-white'
            }`}
          >
            <Icon size={18} className={active(to) ? 'text-[#9FB4FF]' : 'text-ink-nav-2'} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/settings"
            aria-current={active('/settings') ? 'page' : undefined}
            className={`flex items-center gap-[11px] h-control px-3 rounded-sm font-medium text-body border-none w-full transition-colors ${
              active('/settings')
                ? 'bg-navy-pill text-white shadow-[inset_0_0_0_1px_#1C2A41]'
                : 'text-ink-nav hover:bg-navy-pill hover:text-white'
            }`}
          >
            <Settings size={18} className={active('/settings') ? 'text-[#9FB4FF]' : 'text-ink-nav-2'} strokeWidth={1.75} />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="mt-auto pt-[14px] border-t border-navy-line flex items-center gap-[11px]">
        <div className="w-9 h-9 rounded-full bg-[#24416F] text-[#CFE0FF] grid place-items-center font-bold text-[13px] flex-none">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-white truncate">
            {user?.name ?? user?.email ?? ''}
          </div>
          <div className="text-label text-ink-nav-2">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="ml-auto text-ink-nav-2 bg-transparent border-none p-2 rounded-sm grid place-items-center hover:bg-navy-pill hover:text-white transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}
