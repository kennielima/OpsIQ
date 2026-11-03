import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '240px 1fr' }}>
      <Sidebar />
      <main className="min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}
