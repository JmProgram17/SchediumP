/**
 * Authentication related React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, isAuthenticationError } from '@/services/api'
import { queryKeys, CACHE_CONFIG, cacheUtils } from '../query-client'
import { User, LoginRequest, LoginResponse } from '@/types/auth.types'
import { authService } from '@/services/auth/auth.service'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Hook to get current user data
 */
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async (): Promise<User> => {
      const response = await authApi.getUser(undefined, {
        adapter: 'user',
        context: { operation: 'get_current_user' }
      })
      return response.data!
    },
    enabled: isAuthenticated,
    ...CACHE_CONFIG.AUTH,
    staleTime: 2 * 60 * 1000, // 2 minutes for user data
    onSuccess: (data) => {
      // Update auth store with fresh user data
      useAuthStore.getState().user = data
    },
    onError: (error) => {
      if (isAuthenticationError(error)) {
        // Clear user from store
        useAuthStore.getState().user = null
        useAuthStore.getState().isAuthenticated = false
      }
    }
  })
}

/**
 * Hook to get user permissions
 */
export const useUserPermissions = () => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: queryKeys.auth.permissions(),
    queryFn: async (): Promise<string[]> => {
      // Get permissions from authorization service
      const { authorizationService } = await import('@/services/auth/authorization.service')
      return authorizationService.getUserPermissions()
    },
    enabled: isAuthenticated,
    ...CACHE_CONFIG.AUTH,
    staleTime: 5 * 60 * 1000, // 5 minutes for permissions
  })
}

/**
 * Hook to get CSRF token
 */
export const useCsrfToken = () => {
  return useQuery({
    queryKey: queryKeys.auth.csrfToken(),
    queryFn: async (): Promise<string> => {
      return authService.getCsrfToken()
    },
    ...CACHE_CONFIG.AUTH,
    staleTime: 10 * 60 * 1000, // 10 minutes for CSRF token
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

/**
 * Login mutation hook
 */
export const useLogin = () => {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()
  
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async (credentials: LoginRequest): Promise<{ tokens: LoginResponse; user: User }> => {
      return authService.login(credentials)
    },
    onSuccess: ({ tokens, user }) => {
      // Update auth store
      authStore.user = user
      authStore.isAuthenticated = true
      authStore.error = null
      
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.me(), user)
      
      // Prefetch commonly needed data after login
      cacheUtils.prefetch(queryKeys.auth.permissions(), async () => {
        const { authorizationService } = await import('@/services/auth/authorization.service')
        return authorizationService.getUserPermissions()
      })
    },
    onError: (error) => {
      // Update auth store with error
      authStore.error = error instanceof Error ? error.message : 'Login failed'
      authStore.isAuthenticated = false
      authStore.user = null
    }
  })
}

/**
 * Logout mutation hook
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()
  
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async (): Promise<void> => {
      return authService.logout()
    },
    onSuccess: () => {
      // Clear auth store
      authStore.user = null
      authStore.isAuthenticated = false
      authStore.error = null
      
      // Clear all cached data
      queryClient.clear()
    },
    onSettled: () => {
      // Always clear auth data even if logout fails
      authStore.user = null
      authStore.isAuthenticated = false
      queryClient.removeQueries({ queryKey: ['auth'] })
    }
  })
}

/**
 * Change password mutation hook
 */
export const useChangePassword = () => {
  return useMutation({
    mutationKey: ['auth', 'change-password'],
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<void> => {
      return authService.updatePassword(currentPassword, newPassword)
    },
    onSuccess: () => {
      // Could show success notification here
      console.log('Password changed successfully')
    }
  })
}

/**
 * Request password reset mutation hook
 */
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationKey: ['auth', 'request-password-reset'],
    mutationFn: async (email: string): Promise<void> => {
      return authService.requestPasswordReset(email)
    }
  })
}

/**
 * Reset password mutation hook
 */
export const useResetPassword = () => {
  return useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }): Promise<void> => {
      return authService.resetPassword(token, newPassword)
    }
  })
}

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: string) => {
  const { data: permissions = [] } = useUserPermissions()
  
  return permissions.includes(permission)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (permissions: string[]) => {
  const { data: userPermissions = [] } = useUserPermissions()
  
  return permissions.some(permission => userPermissions.includes(permission))
}

/**
 * Hook to check if user has all specified permissions
 */
export const useHasAllPermissions = (permissions: string[]) => {
  const { data: userPermissions = [] } = useUserPermissions()
  
  return permissions.every(permission => userPermissions.includes(permission))
}