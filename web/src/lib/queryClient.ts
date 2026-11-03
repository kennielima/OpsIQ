import { QueryClient } from '@tanstack/react-query'
import { HttpError } from '../api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (count, error) => {
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          return false
        }
        return count < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
