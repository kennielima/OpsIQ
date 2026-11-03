import { env } from '../env'
import { apiClient, HttpError } from './client'
import type { Document, DocumentVisibility } from '../types/api'

export const documentsApi = {
  list: () =>
    apiClient.get<Document[]>('/documents'),

  upload: async (file: File, visibility: DocumentVisibility): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('visibility', visibility)

    const res = await fetch(`${env.apiUrl}/documents`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) throw new HttpError(res.status, `Upload failed (${res.status})`)
    return res.json() as Promise<Document>
  },

  // Backend uses [FromForm], not JSON body
  updateVisibility: async (id: string, visibility: DocumentVisibility): Promise<Document> => {
    const formData = new FormData()
    formData.append('visibility', visibility)

    const res = await fetch(`${env.apiUrl}/documents/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) throw new HttpError(res.status, `Update failed (${res.status})`)
    return res.json() as Promise<Document>
  },

  remove: (id: string) =>
    apiClient.delete<void>(`/documents/${id}`),
}
