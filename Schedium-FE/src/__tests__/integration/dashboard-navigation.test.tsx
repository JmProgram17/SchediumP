/**
 * Dashboard and Navigation Integration Tests
 * Tests dashboard functionality and application navigation flows
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

// Mock dashboard data
const mockDashboardStats = {
  students: {
    total: 150,
    active: 142,
    newThisMonth: 12
  },
  instructors: {
    total: 25,
    active: 23
  },
  programs: {
    total: 8,
    active: 7
  },
  schedules: {
    total: 45,
    thisWeek: 32
  }
}

const mockRecentActivities = [
  {
    id: 1,
    type: 'student_enrollment',
    description: 'Juan Pérez se matriculó en Fundamentos de Programación',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'Admin User'
  },
  {
    id: 2,
    type: 'schedule_created',
    description: 'Nuevo horario creado para Base de Datos - Grupo A',
    timestamp: '2024-01-15T09:15:00Z',
    user: 'Admin User'
  },
  {
    id: 3,
    type: 'instructor_assigned',
    description: 'Pedro Hernández asignado a Desarrollo Web',
    timestamp: '2024-01-15T08:45:00Z',
    user: 'Coordinator'
  }
]

// MSW server setup
const server = setupServer(
  // Auth endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@sena.edu.co',
        first_name: 'Admin',
        last_name: 'User',
        roles: [{ name: 'Administrator' }]
      }
    })
  }),

  // Dashboard stats endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardStats
    })
  }),

  // Recent activities endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/dashboard/activities`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    return HttpResponse.json({
      success: true,
      data: mockRecentActivities.slice(0, limit)
    })
  }),

  // Quick search endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    
    const results = []
    
    if (query.toLowerCase().includes('juan')) {
      results.push({
        id: 'student-1',
        type: 'student',
        title: 'Juan Pérez',
        subtitle: 'juan.perez@sena.edu.co',
        url: '/students/student-1'
      })
    }
    
    if (query.toLowerCase().includes('sistemas')) {
      results.push({
        id: 'program-1',
        type: 'program',
        title: 'Técnico en Sistemas',
        subtitle: 'Programa Técnico',
        url: '/programs/program-1'
      })
    }

    return HttpResponse.json({
      success: true,
      data: results
    })
  }),

  // Students summary for dashboard
  http.get(`${API_CONFIG.BASE_URL}/api/students`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')
    
    const students = [
      { id: 'student-1', firstName: 'Juan', lastName: 'Pérez', status: 'ACTIVE' },
      { id: 'student-2', firstName: 'María', lastName: 'García', status: 'ACTIVE' },
      { id: 'student-3', firstName: 'Carlos', lastName: 'López', status: 'ACTIVE' }
    ]

    return HttpResponse.json({
      success: true,
      data: students.slice(0, limit),
      pagination: { total: students.length }
    })
  }),

  // Schedules summary for dashboard
  http.get(`${API_CONFIG.BASE_URL}/api/schedules`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')
    
    const schedules = [
      {
        id: 'schedule-1',
        course: 'Fundamentos de Programación',
        instructor: 'Pedro Hernández',
        dayOfWeek: 'MONDAY',
        startTime: '07:00'
      },
      {
        id: 'schedule-2',
        course: 'Base de Datos',
        instructor: 'Laura Jiménez',
        dayOfWeek: 'TUESDAY',
        startTime: '09:00'
      }
    ]

    return HttpResponse.json({
      success: true,
      data: schedules.slice(0, limit),
      pagination: { total: schedules.length }
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

describe('Dashboard and Navigation Integration Tests', () => {
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
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  describe('Dashboard Display', () => {
    it('should display dashboard with statistics cards', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show statistics cards
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // Total students
        expect(screen.getByText('142')).toBeInTheDocument() // Active students
        expect(screen.getByText('25')).toBeInTheDocument() // Total instructors
        expect(screen.getByText('8')).toBeInTheDocument() // Total programs
      })

      // Should show card titles
      expect(screen.getByText(/total estudiantes/i)).toBeInTheDocument()
      expect(screen.getByText(/instructores activos/i)).toBeInTheDocument()
      expect(screen.getByText(/programas disponibles/i)).toBeInTheDocument()
      expect(screen.getByText(/horarios esta semana/i)).toBeInTheDocument()
    })

    it('should display recent activities section', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show activities section
      await waitFor(() => {
        expect(screen.getByText(/actividad reciente/i)).toBeInTheDocument()
      })

      // Should show activity items
      await waitFor(() => {
        expect(screen.getByText(/juan pérez se matriculó/i)).toBeInTheDocument()
        expect(screen.getByText(/nuevo horario creado/i)).toBeInTheDocument()
        expect(screen.getByText(/pedro hernández asignado/i)).toBeInTheDocument()
      })
    })

    it('should display quick access cards with recent data', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show recent students
      await waitFor(() => {
        expect(screen.getByText(/estudiantes recientes/i)).toBeInTheDocument()
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })

      // Should show recent schedules
      await waitFor(() => {
        expect(screen.getByText(/horarios próximos/i)).toBeInTheDocument()
        expect(screen.getByText('Fundamentos de Programación')).toBeInTheDocument()
        expect(screen.getByText('Base de Datos')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Flow', () => {
    it('should navigate between different sections using sidebar', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Start at dashboard
      await waitFor(() => {
        expect(screen.getByText(/total estudiantes/i)).toBeInTheDocument()
      })

      // Navigate to students
      const studentsLink = screen.getByRole('link', { name: /estudiantes/i })
      fireEvent.click(studentsLink)

      // Should navigate to students page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/students')
      })

      // Navigate to instructors
      const instructorsLink = screen.getByRole('link', { name: /instructores/i })
      fireEvent.click(instructorsLink)

      // Should navigate to instructors page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/instructors')
      })

      // Navigate to schedules
      const schedulesLink = screen.getByRole('link', { name: /horarios/i })
      fireEvent.click(schedulesLink)

      // Should navigate to schedules page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/schedules')
      })
    })

    it('should highlight active navigation item', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Students nav item should be active
      await waitFor(() => {
        const studentsLink = screen.getByRole('link', { name: /estudiantes/i })
        expect(studentsLink).toHaveClass('active') // Assuming active class is applied
      })
    })

    it('should provide breadcrumb navigation', async () => {
      window.history.pushState({}, '', '/students/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show breadcrumbs
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Estudiantes')).toBeInTheDocument()
        expect(screen.getByText('Crear')).toBeInTheDocument()
      })

      // Breadcrumbs should be clickable
      const dashboardBreadcrumb = screen.getByRole('link', { name: 'Dashboard' })
      fireEvent.click(dashboardBreadcrumb)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard')
      })
    })
  })

  describe('Global Search Functionality', () => {
    it('should perform global search and show results', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Find search input
      const searchInput = await screen.findByPlaceholderText(/buscar.../i)
      
      // Type search query
      fireEvent.change(searchInput, { target: { value: 'Juan' } })

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('juan.perez@sena.edu.co')).toBeInTheDocument()
      })

      // Click on search result
      const resultItem = screen.getByText('Juan Pérez')
      fireEvent.click(resultItem)

      // Should navigate to student detail
      await waitFor(() => {
        expect(window.location.pathname).toBe('/students/student-1')
      })
    })

    it('should show different types of search results', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      const searchInput = await screen.findByPlaceholderText(/buscar.../i)
      
      // Search for program
      fireEvent.change(searchInput, { target: { value: 'sistemas' } })

      // Should show program result
      await waitFor(() => {
        expect(screen.getByText('Técnico en Sistemas')).toBeInTheDocument()
        expect(screen.getByText('Programa Técnico')).toBeInTheDocument()
      })
    })

    it('should handle empty search results', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      const searchInput = await screen.findByPlaceholderText(/buscar.../i)
      
      // Search for non-existent item
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      // Should show no results message
      await waitFor(() => {
        expect(screen.getByText(/no se encontraron resultados/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Quick Actions', () => {
    it('should provide quick action buttons for common tasks', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show quick action buttons
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nuevo estudiante/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /nuevo horario/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /nuevo instructor/i })).toBeInTheDocument()
      })

      // Click new student button
      const newStudentButton = screen.getByRole('button', { name: /nuevo estudiante/i })
      fireEvent.click(newStudentButton)

      // Should navigate to create student form
      await waitFor(() => {
        expect(window.location.pathname).toBe('/students/create')
      })
    })

    it('should show contextual actions based on user role', async () => {
      // Update user role to coordinator
      authStore.getState().login({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        token_type: 'bearer',
        expires_in: 1800,
        user: {
          user_id: 2,
          id: 2,
          username: 'coordinator',
          email: 'coord@sena.edu.co',
          first_name: 'Coord',
          last_name: 'User',
          document_number: '87654321',
          active: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          roles: [{ role_id: 2, name: 'Coordinator', description: 'Academic Coordinator' }]
        }
      })

      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show coordinator-specific actions
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nuevo horario/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /gestionar matrículas/i })).toBeInTheDocument()
      })

      // Should not show admin-only actions
      expect(screen.queryByRole('button', { name: /nuevo instructor/i })).not.toBeInTheDocument()
    })
  })

  describe('Theme and Preferences', () => {
    it('should allow switching between light and dark themes', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Find theme toggle button
      const themeToggle = await screen.findByRole('button', { name: /cambiar tema/i })
      
      // Should start with light theme
      expect(document.documentElement).toHaveClass('light')

      // Click to switch to dark theme
      fireEvent.click(themeToggle)

      // Should switch to dark theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark')
      })

      // Click again to switch back
      fireEvent.click(themeToggle)

      // Should switch back to light theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light')
      })
    })

    it('should persist theme preference across sessions', async () => {
      // Set dark theme in localStorage
      localStorage.setItem('theme', 'dark')

      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should load with dark theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      window.dispatchEvent(new Event('resize'))

      window.history.pushState({}, '', '/dashboard')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show mobile layout
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /menú/i })).toBeInTheDocument()
      })

      // Sidebar should be hidden initially
      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveClass('hidden')

      // Click menu button to show sidebar
      const menuButton = screen.getByRole('button', { name: /menú/i })
      fireEvent.click(menuButton)

      // Sidebar should be visible
      await waitFor(() => {
        expect(sidebar).toHaveClass('visible')
      })
    })
  })
})