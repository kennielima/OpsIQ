import { apiClient } from './client'
import type { AllowedOrigin, CreateWidgetKeyResponse, TeamMember, WidgetKey } from '../types/api'

export interface AddTeamMemberRequest {
  name: string
  email: string
  temporaryPassword: string
  role: 'Admin' | 'Staff'
}

export const settingsApi = {
  listWidgetKeys: () =>
    apiClient.get<WidgetKey[]>('/widget-keys'),

  createWidgetKey: () =>
    apiClient.post<CreateWidgetKeyResponse>('/widget-keys'),

  revokeWidgetKey: (id: string) =>
    apiClient.post<void>(`/widget-keys/${id}/revoke`),

  listAllowedOrigins: () =>
    apiClient.get<AllowedOrigin[]>('/allowed-origins'),

  addAllowedOrigin: (origin: string) =>
    apiClient.post<AllowedOrigin>('/allowed-origins', { origin }),

  removeAllowedOrigin: (id: string) =>
    apiClient.delete<void>(`/allowed-origins/${id}`),

  listTeamMembers: () =>
    apiClient.get<TeamMember[]>('/users'),

  addTeamMember: (body: AddTeamMemberRequest) =>
    apiClient.post<TeamMember>('/users', body),
}
