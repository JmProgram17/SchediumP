/**
 * Authentication Flow Integration Tests
 * Tests complete user authentication workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { App } from '@/App'
import { ThemeProvider } from '@/design-system/themes'
import { API_CONFIG } from '@/config'
import { authStore } from '@/stores/auth.store'

// Mock data
const mockCredentials = {
  email: 'admin@sena.edu.co',
  password: 'admin123'
}

const mockUser = {
  user_id: 1,
  id: 1,
  username: 'admin',
  email: 'admin@sena.edu.co',
  first_name: 'Admin',
  last_name: 'User',
  document_number: '12345678',
  active: true,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  roles: [
    {
      role_id: 1,
      name: 'Administrator',
      description: 'Full system access',
      permissions: []
    }
  ]
}

// MSW server setup
const server = setupServer(
  // Login endpoint
  http.post(`${API_CONFIG.BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === mockCredentials.email && body.password === mockCredentials.password) {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          expires_in: 1800,
          user: mockUser
        }
      })
    }

    return HttpResponse.json(
      {
        success: false,
        error_code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      },
      { status: 401 }
    )
  }),

  // Current user endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader === 'Bearer mock-access-token') {
      return HttpResponse.json({
        success: true,
        data: mockUser
      })
    }

    return HttpResponse.json(
      {
        success: false,
        error_code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      },
      { status: 401 }
    )
  }),

  // Logout endpoint
  http.post(`${API_CONFIG.BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  }),

  // CSRF token endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/csrf-token`, () => {
    return HttpResponse.json({
      success: true,
      data: { csrf_token: 'mock-csrf-token' }
    })
  })
)

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        ThemeProvider,
        null,
        children
      )
    )
  )
}

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    server.listen()
    // Reset auth store
    authStore.getState().logout()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  describe('Login Flow', () => {
    it('should complete successful login flow and redirect to dashboard', async () => {
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should start at login page (unauthenticated)
      expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()

      // Fill login form
      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: mockCredentials.email }
      })
      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: mockCredentials.password }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should show loading state
      expect(screen.getByRole('button', { name: /iniciando/i })).toBeDisabled()

      // Wait for successful login and redirect
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify user data is displayed
      expect(screen.getByText(/admin user/i)).toBeInTheDocument()
      
      // Verify auth store state
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(true)
      expect(authState.user?.email).toBe(mockCredentials.email)
      expect(authState.token).toBe('mock-access-token')
    })

    it('should handle login validation errors', async () => {
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/usuario es requerido/i)).toBeInTheDocument()
        expect(screen.getByText(/contraseña es requerida/i)).toBeInTheDocument()
      })

      // Fill invalid data
      fireEvent.change(screen.getByLabelText(/usuario/i), {
        target: { value: 'a' }
      })
      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: '123' }
      })

      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should show format validation errors
      await waitFor(() => {
        expect(screen.getByText(/mínimo 3 caracteres/i)).toBeInTheDocument()
        expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should handle login authentication errors', async () => {
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Fill with invalid credentials
      fireEvent.change(screen.getByLabelText(/usuario/i), {
        target: { value: 'wronguser' }
      })
      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'wrongpass' }
      })

      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      // Should show authentication error
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
      })

      // Should stay on login page
      expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      
      // Auth store should remain unauthenticated
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', async () => {
      // Try to access dashboard directly
      window.history.pushState({}, '', '/dashboard')
      
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      })
    })

    it('should allow authenticated users to access protected routes', async () => {
      // Set up authenticated state
      authStore.getState().login({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: mockUser
      })

      // Navigate to dashboard
      window.history.pushState({}, '', '/dashboard')
      
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should access dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Logout Flow', () => {
    it('should complete logout flow and redirect to login', async () => {
      // Start with authenticated state
      authStore.getState().login({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: mockUser
      })

      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should be on dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i })
      fireEvent.click(logoutButton)

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      })

      // Auth store should be cleared
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should persist authentication across page refreshes', async () => {
      // Login user
      authStore.getState().login({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: mockUser
      })

      // Simulate page refresh by creating new app instance
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should restore authenticated state
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })

      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(true)
    })

    it('should handle token expiration gracefully', async () => {
      // Set up server to return 401 for expired token
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/auth/me`, () => {
          return HttpResponse.json(
            {
              success: false,
              error_code: 'TOKEN_EXPIRED',
              message: 'Token has expired'
            },
            { status: 401 }
          )
        })
      )

      // Start with authenticated state
      authStore.getState().login({
        access_token: 'expired-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: mockUser
      })

      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should redirect to login due to expired token
      await waitFor(() => {
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      })

      // Auth store should be cleared
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
    })
  })
})