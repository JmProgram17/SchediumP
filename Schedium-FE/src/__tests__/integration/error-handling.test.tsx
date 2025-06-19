/**
 * Error Handling Integration Tests
 * Tests error boundaries, network failures, and error recovery workflows
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

// MSW server setup for error scenarios
const server = setupServer(
  // Auth endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        roles: [{ name: 'Administrator' }]
      }
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

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    server.listen()
    authStore.getState().login({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      token_type: 'bearer',
      expires_in: 1800,
      user: {
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
        roles: [{ role_id: 1, name: 'Administrator', description: 'Admin' }]
      }
    })

    // Suppress console errors for testing
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  describe('Network Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/students`, () => {
          return HttpResponse.error()
        })
      )

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument()
        expect(screen.getByText(/no se pudo cargar la información/i)).toBeInTheDocument()
      })

      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      expect(retryButton).toBeInTheDocument()

      // Fix network and retry
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/students`, () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'student-1',
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@sena.edu.co'
              }
            ],
            pagination: { page: 1, total: 1 }
          })
        })
      )

      fireEvent.click(retryButton)

      // Should recover and show data
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })
    })

    it('should handle server errors (500) with appropriate messaging', async () => {
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/students`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Internal server error',
              error_code: 'SERVER_ERROR'
            },
            { status: 500 }
          )
        })
      )

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show server error message
      await waitFor(() => {
        expect(screen.getByText(/error del servidor/i)).toBeInTheDocument()
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })

      // Should provide contact support option
      expect(screen.getByText(/contactar soporte/i)).toBeInTheDocument()
    })

    it('should handle API rate limiting (429)', async () => {
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/students`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Too many requests',
              error_code: 'RATE_LIMITED',
              retry_after: 60
            },
            { status: 429 }
          )
        })
      )

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show rate limit message
      await waitFor(() => {
        expect(screen.getByText(/demasiadas solicitudes/i)).toBeInTheDocument()
        expect(screen.getByText(/intenta de nuevo en/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Error Handling', () => {
    it('should handle token expiration during operation', async () => {
      // Start with valid token, then expire it
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/students`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          
          if (authHeader === 'Bearer mock-token') {
            return HttpResponse.json(
              {
                success: false,
                message: 'Token expired',
                error_code: 'TOKEN_EXPIRED'
              },
              { status: 401 }
            )
          }

          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, total: 0 }
          })
        })
      )

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sesión expirada/i)).toBeInTheDocument()
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      })

      // Auth store should be cleared
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
    })

    it('should handle insufficient permissions gracefully', async () => {
      server.use(
        http.delete(`${API_CONFIG.BASE_URL}/api/students/student-1`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Insufficient permissions',
              error_code: 'FORBIDDEN'
            },
            { status: 403 }
          )
        })
      )

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Mock clicking delete button
      const deleteButton = screen.getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /confirmar/i })
      fireEvent.click(confirmButton)

      // Should show permission error
      await waitFor(() => {
        expect(screen.getByText(/permisos insuficientes/i)).toBeInTheDocument()
        expect(screen.getByText(/no tienes autorización/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation Error Handling', () => {
    it('should handle form validation errors from server', async () => {
      server.use(
        http.post(`${API_CONFIG.BASE_URL}/api/students`, async ({ request }) => {
          // Parse body but don't use it for this validation test
          await request.json()
          
          return HttpResponse.json(
            {
              success: false,
              message: 'Validation failed',
              errors: {
                email: 'Email already exists',
                documentNumber: 'Invalid document number format',
                phone: 'Phone number is required'
              }
            },
            { status: 422 }
          )
        })
      )

      window.history.pushState({}, '', '/students/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Fill form with invalid data
      await waitFor(() => {
        expect(screen.getByText(/crear estudiante/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Test' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'duplicate@sena.edu.co' }
      })

      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

      // Should show field-specific errors
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid document number/i)).toBeInTheDocument()
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument()
      })

      // Form should remain editable
      expect(screen.getByLabelText(/nombre/i)).not.toBeDisabled()
    })

    it('should handle business logic validation errors', async () => {
      server.use(
        http.post(`${API_CONFIG.BASE_URL}/api/enrollments`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Enrollment validation failed',
              error_code: 'BUSINESS_RULE_VIOLATION',
              details: {
                rule: 'MAX_ENROLLMENTS_PER_SEMESTER',
                limit: 6,
                current: 6
              }
            },
            { status: 409 }
          )
        })
      )

      window.history.pushState({}, '', '/enrollments/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Try to create enrollment
      await waitFor(() => {
        expect(screen.getByText(/matricular estudiante/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /matricular/i }))

      // Should show business rule error
      await waitFor(() => {
        expect(screen.getByText(/máximo de matrículas por semestre/i)).toBeInTheDocument()
        expect(screen.getByText(/6\/6 matrículas utilizadas/i)).toBeInTheDocument()
      })

      // Should provide alternative actions
      expect(screen.getByRole('button', { name: /ver matrículas actuales/i })).toBeInTheDocument()
    })
  })

  describe('Component Error Boundaries', () => {
    it('should catch and display feature-level errors', async () => {
      // Mock component error by making a component throw
      // Note: Component defined but not used in this test scenario

      // This would require modifying the component to throw errors
      // In a real scenario, you'd test actual component failures
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Simulate component error by calling error boundary directly
      // Note: errorBoundary element retrieved but not used in this test scenario
      
      // Trigger error boundary
      fireEvent.click(screen.getByTestId('trigger-error'))

      // Should show feature-specific error UI
      await waitFor(() => {
        expect(screen.getByText(/error en estudiantes/i)).toBeInTheDocument()
        expect(screen.getByText(/gestión de estudiantes/i)).toBeInTheDocument()
      })

      // Should show recovery options
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
    })

    it('should provide different error UIs based on error type', async () => {
      // Test data loading error
      server.use(
        http.get(`${API_CONFIG.BASE_URL}/api/programs`, () => {
          return HttpResponse.error()
        })
      )

      window.history.pushState({}, '', '/programs')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show data loading error UI
      await waitFor(() => {
        expect(screen.getByText(/error cargando programas/i)).toBeInTheDocument()
        expect(screen.getByText(/verificar configuración académica/i)).toBeInTheDocument()
      })

      // Should show program-specific suggestions
      expect(screen.getByText(/contactar coordinación académica/i)).toBeInTheDocument()
    })
  })

  describe('Data Consistency Error Handling', () => {
    it('should handle stale data conflicts during updates', async () => {
      let updateAttempts = 0

      server.use(
        http.put(`${API_CONFIG.BASE_URL}/api/students/student-1`, async ({ request: _request }) => {
          updateAttempts++
          
          if (updateAttempts === 1) {
            return HttpResponse.json(
              {
                success: false,
                message: 'Data has been modified by another user',
                error_code: 'STALE_DATA',
                current_version: 2,
                provided_version: 1
              },
              { status: 409 }
            )
          }

          return HttpResponse.json({
            success: true,
            data: {
              id: 'student-1',
              firstName: 'Juan Carlos',
              lastName: 'Pérez',
              version: 2
            }
          })
        })
      )

      window.history.pushState({}, '', '/students/student-1/edit')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Make an update
      await waitFor(() => {
        expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Juan Carlos' }
      })

      fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))

      // Should show conflict resolution dialog
      await waitFor(() => {
        expect(screen.getByText(/conflicto de datos/i)).toBeInTheDocument()
        expect(screen.getByText(/modificado por otro usuario/i)).toBeInTheDocument()
      })

      // Should provide resolution options
      expect(screen.getByRole('button', { name: /recargar datos/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /forzar actualización/i })).toBeInTheDocument()

      // Choose to reload data
      fireEvent.click(screen.getByRole('button', { name: /recargar datos/i }))

      // Should reload form with fresh data
      await waitFor(() => {
        expect(screen.queryByText(/conflicto de datos/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Offline Error Handling', () => {
    it('should detect and handle offline state', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show offline banner
      await waitFor(() => {
        expect(screen.getByText(/sin conexión/i)).toBeInTheDocument()
        expect(screen.getByText(/algunas funciones no están disponibles/i)).toBeInTheDocument()
      })

      // Should disable creation/editing actions
      const createButton = screen.getByRole('button', { name: /nuevo estudiante/i })
      expect(createButton).toBeDisabled()

      // Mock coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      window.dispatchEvent(new Event('online'))

      // Should hide offline banner and re-enable actions
      await waitFor(() => {
        expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument()
      })

      expect(createButton).not.toBeDisabled()
    })
  })
})