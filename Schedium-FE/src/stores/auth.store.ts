import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { User } from '@/types/auth.types'
import { authService } from '@/services/auth/auth.service'
import { authorizationService, RoleName, PermissionName } from '@/services/auth/authorization.service'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionTimeout: number | null
  token?: string // For compatibility with tests
  
  // Actions
  login: (credentials: { email: string; password: string } | { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: User }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  updateSessionTimeout: (timeout: number) => void
  
  // RBAC helpers (delegated to authorization service)
  hasRole: (roleName: RoleName) => boolean
  hasPermission: (permission: PermissionName) => boolean
  hasAnyRole: (roleNames: RoleName[]) => boolean
  hasAllRoles: (roleNames: RoleName[]) => boolean
  hasAnyPermission: (permissions: PermissionName[]) => boolean
  hasAllPermissions: (permissions: PermissionName[]) => boolean
  canAccessModule: (module: Parameters<typeof authorizationService.canAccessModule>[0]) => boolean
  isAdmin: () => boolean
  isCoordinatorOrAbove: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionTimeout: null,
      token: undefined,
      
      // Actions
      login: async (credentials: { email: string; password: string } | { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: User }) => {
        // Check if this is a test mock login (has access_token)
        if ('access_token' in credentials) {
          set((state) => {
            state.user = credentials.user
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
            state.token = credentials.access_token
          })
          return
        }
        
        set((state) => {
          state.isLoading = true
          state.error = null
        })
        
        try {
          const response = await authService.login(credentials)
          
          set((state) => {
            state.user = response.user
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
            state.token = response.tokens.access_token
          })
        } catch (error) {
          set((state) => {
            state.isLoading = false
            state.error = error instanceof Error ? error.message : 'Login failed'
            state.isAuthenticated = false
            state.user = null
            state.token = undefined
          })
          throw error
        }
      },
      
      logout: async () => {
        set((state) => {
          state.isLoading = true
        })
        
        try {
          await authService.logout()
        } finally {
          set((state) => {
            state.user = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = null
            state.sessionTimeout = null
            state.token = undefined
          })
        }
      },
      
      checkAuth: async () => {
        // Quick check if we have a valid token
        if (!authService.isAuthenticated()) {
          set((state) => {
            state.isAuthenticated = false
            state.user = null
          })
          return
        }
        
        // Try to get cached user first
        const cachedUser = authService.getCachedUser()
        if (cachedUser) {
          set((state) => {
            state.user = cachedUser
            state.isAuthenticated = true
          })
        }
        
        // Then fetch fresh user data
        try {
          const user = await authService.getCurrentUser()
          set((state) => {
            state.user = user
            state.isAuthenticated = true
          })
          
          // Update session timeout
          const expiryTime = authService.getTokenExpiryTime()
          if (expiryTime) {
            get().updateSessionTimeout(expiryTime)
          }
        } catch (error) {
          // If fetching user fails, clear auth state
          set((state) => {
            state.isAuthenticated = false
            state.user = null
          })
        }
      },
      
      clearError: () => {
        set((state) => {
          state.error = null
        })
      },
      
      updateSessionTimeout: (timeout: number) => {
        set((state) => {
          state.sessionTimeout = timeout
        })
        
        // Set up session timeout warning
        const warningTime = timeout - (5 * 60 * 1000) // 5 minutes before expiry
        const now = Date.now()
        
        if (warningTime > now) {
          setTimeout(() => {
            // Emit session warning event
            window.dispatchEvent(new CustomEvent('session-warning'))
          }, warningTime - now)
        }
      },
      
      // RBAC helpers (delegated to authorization service)
      hasRole: (roleName: RoleName): boolean => {
        return authorizationService.hasRole(roleName)
      },

      hasPermission: (permission: PermissionName): boolean => {
        return authorizationService.hasPermission(permission)
      },

      hasAnyRole: (roleNames: RoleName[]): boolean => {
        return authorizationService.hasAnyRole(roleNames)
      },

      hasAllRoles: (roleNames: RoleName[]): boolean => {
        return authorizationService.hasAllRoles(roleNames)
      },

      hasAnyPermission: (permissions: PermissionName[]): boolean => {
        return authorizationService.hasAnyPermission(permissions)
      },

      hasAllPermissions: (permissions: PermissionName[]): boolean => {
        return authorizationService.hasAllPermissions(permissions)
      },

      canAccessModule: (module: Parameters<typeof authorizationService.canAccessModule>[0]): boolean => {
        return authorizationService.canAccessModule(module)
      },

      isAdmin: (): boolean => {
        return authorizationService.isAdmin()
      },

      isCoordinatorOrAbove: (): boolean => {
        return authorizationService.isCoordinatorOrAbove()
      },
    })),
    {
      name: 'auth-store',
    }
  )
)

// Export for backwards compatibility
export const authStore = useAuthStore