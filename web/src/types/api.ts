export type Role = 'Admin' | 'Staff'

export type DocumentStatus = 'Processing' | 'Ready' | 'Failed'
export type DocumentVisibility = 'Internal' | 'Public'

export interface MeResponse {
  userId: string
  email: string
  role: string        // raw value from backend: "TenantAdmin" | "TenantUser" | "SuperAdmin"
  tenantId?: string   // legacy — prefer tenant.id
  tenant?: { id: string; name: string; slug?: string }
  displayName?: string
  name?: string
  tenantName?: string // legacy
}

// Matches the backend Document entity (camelCase serialization)
export interface Document {
  id: string
  fileName: string    // backend field (not "name")
  status: DocumentStatus
  visibility: DocumentVisibility
  uploadedAt: string
  contentType?: string
  isDeleted?: boolean
}

// Matches the backend citation shape from QueryController
export interface Citation {
  rank: number
  chunkId: string
  documentId: string
  content: string     // chunk text (used as snippet)
  score: number
  // enriched fields (if backend adds them later)
  documentTitle?: string
  snippet?: string
  visibility?: DocumentVisibility
  uploadedAt?: string
}

// Matches the backend QueryController response
export interface QueryResponse {
  answer: string | null
  citations: Citation[]
  // answerFound not returned — derive from answer !== null
  conversationId?: string
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
  lastUsedAt?: string | null
  status: 'Active' | 'Revoked'
}

export interface CreateWidgetKeyResponse {
  id: string
  rawKey: string
  prefix: string
  createdAt: string
}

export interface TeamMember {
  id: string
  name?: string
  email: string
  role: Role
}

export interface ApiError {
  status: number
  message: string
}
