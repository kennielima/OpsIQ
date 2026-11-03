import { apiClient } from './client'
import type { MeResponse } from '../types/api'

export interface LoginRequest {
  email: string
  password: string
}

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<void>('/auth/login', body),

  logout: () =>
    apiClient.post<void>('/auth/logout'),

  me: () =>
    apiClient.get<MeResponse>('/me'),
}
