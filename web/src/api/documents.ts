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

    const response = await fetch(`${env.apiUrl}/documents`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) throw new HttpError(response.status, `Upload failed (${response.status})`)
    return response.json() as Promise<Document>
  },

  updateVisibility: (id: string, visibility: DocumentVisibility) =>
    apiClient.patch<Document>(`/documents/${id}`, { visibility }),

  remove: (id: string) =>
    apiClient.delete<void>(`/documents/${id}`),
}
