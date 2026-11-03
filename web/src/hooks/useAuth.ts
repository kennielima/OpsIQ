import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { queryKeys } from '../lib/queryKeys'
import type { MeResponse } from '../types/api'

export function useAuth() {
  const { data: user, isLoading } = useQuery<MeResponse>({
    queryKey: queryKeys.me(),
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return {
    user,
    role: user?.role,
    isAdmin: user?.role === 'Admin',
    isLoading,
    isAuthenticated: !!user,
  }
}

export function useClearAuth() {
  const queryClient = useQueryClient()
  return () => queryClient.removeQueries({ queryKey: queryKeys.me() })
}
