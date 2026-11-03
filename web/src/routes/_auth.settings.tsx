import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsPage } from '../features/settings/SettingsPage'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queryKeys'

export const Route = createFileRoute('/_auth/settings')({
  beforeLoad: async () => {
    const user = queryClient.getQueryData<{ role: string }>(queryKeys.me())
    if (user?.role !== 'Admin' && user?.role !== 'TenantAdmin') {
      throw redirect({ to: '/not-allowed' })
    }
  },
  component: SettingsPage,
})
