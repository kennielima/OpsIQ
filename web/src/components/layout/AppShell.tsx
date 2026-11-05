import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:grid lg:items-stretch" style={{ gridTemplateColumns: '240px 1fr' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col bg-navy self-stretch">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy border-b border-navy-line sticky top-0 z-30">
        <button onClick={() => setOpen(true)} className="text-ink-nav-2 hover:text-white p-1">
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="OpsIQ" className="w-6 h-6 rounded" />
          <span className="font-bold text-white text-[15px]">OpsIQ</span>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="relative z-50 w-[240px] flex-none">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-3 text-ink-nav-2 hover:text-white z-10">
              <X size={20} strokeWidth={1.75} />
            </button>
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}
