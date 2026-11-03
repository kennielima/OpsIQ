import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '../components/layout/AppShell'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queryKeys'
import { authApi } from '../api/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    try {
      const user = await queryClient.ensureQueryData({
        queryKey: queryKeys.me(),
        queryFn: authApi.me,
      })
      return { user }
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <AppShell><Outlet /></AppShell>,
})
