import type { Conversation, ConversationDetail } from '../types/api'

// Conversations endpoints don't exist on the backend yet.
// Return empty lists so History page renders its empty state gracefully.
export const conversationsApi = {
  list: (): Promise<Conversation[]> => Promise.resolve([]),
  get: (_id: string): Promise<ConversationDetail> => Promise.reject(new Error('Not implemented')),
}
