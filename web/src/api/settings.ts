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
  // No list endpoint exists on backend — return empty
  listWidgetKeys: (): Promise<WidgetKey[]> => Promise.resolve([]),

  createWidgetKey: (): Promise<CreateWidgetKeyResponse> =>
    apiClient.post<{ id: string; rawKey: string }>(
      `/tenants/${tenantId()}/keys`
    ).then(r => ({
      id: r.id,
      rawKey: r.rawKey,
      prefix: r.rawKey.slice(0, 16),
      createdAt: new Date().toISOString(),
    })),

  revokeWidgetKey: (id: string): Promise<void> =>
    apiClient.delete<void>(`/tenants/${tenantId()}/keys/${id}`),

  // ── Allowed origins — not implemented on backend yet ─────────
  listAllowedOrigins: (): Promise<import('../types/api').AllowedOrigin[]> => Promise.resolve([]),
  addAllowedOrigin: (_origin: string): Promise<import('../types/api').AllowedOrigin> => Promise.resolve({ id: '', origin: _origin }),
  removeAllowedOrigin: (_id: string): Promise<void> => Promise.resolve(),

  // ── Team ──────────────────────────────────────────────────────
  // No list endpoint — return empty
  listTeamMembers: (): Promise<TeamMember[]> => Promise.resolve([]),

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
}
