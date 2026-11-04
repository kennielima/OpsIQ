import { apiClient } from './client'
import type { Conversation, ConversationDetail } from '../types/api'

export const conversationsApi = {
  list: (): Promise<Conversation[]> =>
    apiClient.get<Conversation[]>('/conversations'),

  get: (id: string): Promise<ConversationDetail> =>
    apiClient.get<ConversationDetail>(`/conversations/${id}`),
}
