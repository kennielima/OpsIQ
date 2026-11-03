import { env } from '../env'
import type { ApiError } from '../types/api'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (response.status === 401) throw new HttpError(401, 'Unauthorized')
  if (response.status === 403) throw new HttpError(403, 'Forbidden')
  if (response.status === 429) throw new HttpError(429, 'Too many requests, try again shortly.')

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const err: ApiError = await response.json()
      if (err.message) message = err.message
    } catch {
      // keep generic message
    }
    throw new HttpError(response.status, message)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
