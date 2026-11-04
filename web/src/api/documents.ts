import { env } from '../env'
import { apiClient, HttpError } from './client'
import type { Document, DocumentStatus, DocumentVisibility } from '../types/api'

function mapStatus(n: number): DocumentStatus {
  if (n === 0) return 'Processing'
  if (n === 1) return 'Ready'
  return 'Failed'
}

function mapVisibility(n: number): DocumentVisibility {
  return n === 1 ? 'Public' : 'Internal'
}

function mapVisibilityOut(v: DocumentVisibility): number {
  return v === 'Public' ? 1 : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any): Document {
  return { ...raw, status: mapStatus(raw.status), visibility: mapVisibility(raw.visibility) }
}

export const documentsApi = {
  list: () =>
    apiClient.get<unknown[]>('/documents').then(r => r.map(normalize)),

  upload: async (file: File, visibility: DocumentVisibility): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('visibility', String(mapVisibilityOut(visibility)))

    const res = await fetch(`${env.apiUrl}/documents`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) throw new HttpError(res.status, `Upload failed (${res.status})`)
    return res.json().then(normalize)
  },

  updateVisibility: async (id: string, visibility: DocumentVisibility): Promise<Document> => {
    const formData = new FormData()
    formData.append('visibility', String(mapVisibilityOut(visibility)))

    const res = await fetch(`${env.apiUrl}/documents/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) throw new HttpError(res.status, `Update failed (${res.status})`)
    return res.json().then(normalize)
  },

  remove: (id: string) =>
    apiClient.delete<void>(`/documents/${id}`),
}
