import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../auth.store'
import { authService } from '@/services/auth/auth.service'
import { LoginResponse, User } from '@/types/auth.types'

// Mock the auth service
vi.mock('@/services/auth/auth.service')

const mockAuthService = authService as any

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionTimeout: null,
    })
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        roles: [
          {
            id: 1,
            name: 'Administrator',
            description: 'Full access',
            permissions: [],
          },
        ],
      }

      const mockLoginResponse: LoginResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: mockUser,
      }

      mockAuthService.login.mockResolvedValue(mockLoginResponse)

      const { login } = useAuthStore.getState()
      
      await login('testuser', 'password')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().error).toBe(null)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials')
      mockAuthService.login.mockRejectedValue(mockError)

      const { login } = useAuthStore.getState()
      
      await expect(login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials')

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBe(null)
      expect(useAuthStore.getState().error).toBe('Invalid credentials')
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          roles: [],
        },
        isAuthenticated: true,
      })

      mockAuthService.logout.mockResolvedValue(undefined)

      const { logout } = useAuthStore.getState()
      
      await logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBe(null)
      expect(useAuthStore.getState().sessionTimeout).toBe(null)
    })
  })

  describe('RBAC helpers', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          roles: [
            {
              id: 1,
              name: 'Administrator',
              description: 'Full access',
              permissions: [
                {
                  id: 1,
                  name: 'view_users',
                  resource: 'users',
                  action: 'view',
                },
                {
                  id: 2,
                  name: 'create_users',
                  resource: 'users',
                  action: 'create',
                },
              ],
            },
            {
              id: 2,
              name: 'Coordinator',
              description: 'Limited access',
              permissions: [
                {
                  id: 3,
                  name: 'view_schedules',
                  resource: 'schedules',
                  action: 'view',
                },
              ],
            },
          ],
        },
        isAuthenticated: true,
      })
    })

    describe('hasRole', () => {
      it('should return true for existing role', () => {
        const { hasRole } = useAuthStore.getState()
        expect(hasRole('Administrator')).toBe(true)
        expect(hasRole('Coordinator')).toBe(true)
      })

      it('should return false for non-existing role', () => {
        const { hasRole } = useAuthStore.getState()
        expect(hasRole('Secretary')).toBe(false)
      })
    })

    describe('hasPermission', () => {
      it('should return true for existing permission', () => {
        const { hasPermission } = useAuthStore.getState()
        expect(hasPermission('users.view')).toBe(true)
        expect(hasPermission('users.create')).toBe(true)
        expect(hasPermission('schedules.view')).toBe(true)
      })

      it('should return false for non-existing permission', () => {
        const { hasPermission } = useAuthStore.getState()
        expect(hasPermission('users.delete')).toBe(false)
        expect(hasPermission('schedules.create')).toBe(false)
      })
    })

    describe('hasAnyRole', () => {
      it('should return true if user has any of the specified roles', () => {
        const { hasAnyRole } = useAuthStore.getState()
        expect(hasAnyRole(['Administrator', 'Secretary'])).toBe(true)
        expect(hasAnyRole(['Coordinator', 'Secretary'])).toBe(true)
      })

      it('should return false if user has none of the specified roles', () => {
        const { hasAnyRole } = useAuthStore.getState()
        expect(hasAnyRole(['Secretary', 'Instructor'])).toBe(false)
      })
    })

    describe('hasAllRoles', () => {
      it('should return true if user has all specified roles', () => {
        const { hasAllRoles } = useAuthStore.getState()
        expect(hasAllRoles(['Administrator', 'Coordinator'])).toBe(true)
      })

      it('should return false if user is missing any specified role', () => {
        const { hasAllRoles } = useAuthStore.getState()
        expect(hasAllRoles(['Administrator', 'Secretary'])).toBe(false)
      })
    })
  })
})