import { apiClient } from './client'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queryKeys'
import type { MeResponse, WidgetKey, CreateWidgetKeyResponse, TeamMember } from '../types/api'

function tenantId(): string {
  const me = queryClient.getQueryData<MeResponse>(queryKeys.me())
  if (!me?.tenantId) throw new Error('No tenant context')
  return me.tenantId
}

export const settingsApi = {
  // ── Widget keys ──────────────────────────────────────────────
  listWidgetKeys: (): Promise<WidgetKey[]> =>
    apiClient.get<WidgetKey[]>(`/tenants/${tenantId()}/keys`),

  createWidgetKey: (): Promise<CreateWidgetKeyResponse> =>
    apiClient.post<{ id: string; rawKey: string }>(
      `/tenants/${tenantId()}/keys`
    ).then(r => ({
      id: r.id,
      rawKey: r.rawKey,
      prefix: r.rawKey.slice(0, 12),
      createdAt: new Date().toISOString(),
    })),

  revokeWidgetKey: (id: string): Promise<void> =>
    apiClient.delete<void>(`/tenants/${tenantId()}/keys/${id}`),

  // ── Allowed origins ──────────────────────────────────────────
  listAllowedOrigins: (): Promise<string[]> =>
    apiClient.get<string[]>(`/tenants/${tenantId()}/origins`),

  setAllowedOrigins: (origins: string[]): Promise<void> =>
    apiClient.put<void>(`/tenants/${tenantId()}/origins`, origins),

  // ── Team ──────────────────────────────────────────────────────
  listTeamMembers: (): Promise<TeamMember[]> =>
    apiClient.get<{ id: string; email: string; displayName: string; role: number }[]>(
      `/tenants/${tenantId()}/users`
    ).then(users => users.map(u => ({
      id: u.id,
      name: u.displayName,
      email: u.email,
      role: u.role === 1 ? 'Admin' : 'Staff' as 'Admin' | 'Staff',
    }))),

  addTeamMember: (body: { name: string; email: string; temporaryPassword: string; role: string }) =>
    apiClient.post<{ id: string; email: string; displayName: string; tenantId: string }>(
      `/tenants/${tenantId()}/users`,
      {
        email: body.email,
        displayName: body.name,
        password: body.temporaryPassword,
      }
    ).then(r => ({
      id: r.id,
      name: r.displayName,
      email: r.email,
      role: body.role as 'Admin' | 'Staff',
    })),

  removeTeamMember: (userId: string): Promise<void> =>
    apiClient.delete<void>(`/tenants/${tenantId()}/users/${userId}`),

  updateMemberRole: (userId: string, role: 'Admin' | 'Staff'): Promise<void> =>
    apiClient.patch<void>(`/tenants/${tenantId()}/users/${userId}/role`, role),
}
