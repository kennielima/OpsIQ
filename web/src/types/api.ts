export type Role = 'Admin' | 'Staff'

export type DocumentStatus = 'Processing' | 'Ready' | 'Failed'
export type DocumentVisibility = 'Internal' | 'Public'

export interface MeResponse {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string
  tenantName: string
}

export interface Document {
  id: string
  name: string
  status: DocumentStatus
  failureReason?: string
  visibility: DocumentVisibility
  uploadedAt: string
  fileSizeBytes?: number
  chunkCount?: number
}

export interface Citation {
  rank: number
  documentTitle: string
  snippet: string
  visibility: DocumentVisibility
  uploadedAt: string
}

export interface QueryResponse {
  answer: string | null
  answerFound: boolean
  citations: Citation[]
  conversationId: string
}

export interface Conversation {
  id: string
  question: string
  createdAt: string
  citationCount: number
  answerFound: boolean
}

export interface ConversationDetail extends Conversation {
  answer: string
  citations: Citation[]
}

export interface WidgetKey {
  id: string
  prefix: string
  createdAt: string
  status: 'Active' | 'Revoked'
}

export interface CreateWidgetKeyResponse {
  id: string
  rawKey: string
  prefix: string
  createdAt: string
}

export interface AllowedOrigin {
  id: string
  origin: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
}

export interface ApiError {
  status: number
  message: string
}
