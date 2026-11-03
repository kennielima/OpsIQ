import { apiClient } from './client'
import type { QueryResponse } from '../types/api'

export interface QueryRequest {
  question: string
  conversationId?: string
}

export const queryApi = {
  ask: (body: QueryRequest) =>
    apiClient.post<QueryResponse>('/query', body),
}
