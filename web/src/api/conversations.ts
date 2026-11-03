import { apiClient } from './client'
import type { Conversation, ConversationDetail } from '../types/api'

export const conversationsApi = {
  list: () =>
    apiClient.get<Conversation[]>('/conversations'),

  get: (id: string) =>
    apiClient.get<ConversationDetail>(`/conversations/${id}`),
}
