/**
 * Student Management Integration Tests
 * Tests complete student CRUD workflows
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

// Mock student data
const mockStudents = [
  {
    id: 'student-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@sena.edu.co',
    documentType: 'CC',
    documentNumber: '1234567890',
    program: 'Sistemas',
    semester: 1,
    status: 'ACTIVE',
    phone: '3001234567',
    enrollmentDate: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'student-2',
    firstName: 'María',
    lastName: 'García',
    email: 'maria.garcia@sena.edu.co',
    documentType: 'CC',
    documentNumber: '9876543210',
    program: 'Administración',
    semester: 3,
    status: 'ACTIVE',
    phone: '3009876543',
    enrollmentDate: '2023-08-15T00:00:00Z',
    createdAt: '2023-08-15T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  }
]

let studentsData = [...mockStudents]

// MSW server setup
const server = setupServer(
  // Auth endpoints
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

  // Students list endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/students`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''

    let filteredStudents = [...studentsData]

    if (search) {
      filteredStudents = filteredStudents.filter(student =>
        student.firstName.toLowerCase().includes(search.toLowerCase()) ||
        student.lastName.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    const total = filteredStudents.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedStudents = filteredStudents.slice(offset, offset + limit)

    return HttpResponse.json({
      success: true,
      data: paginatedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  }),

  // Single student endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/students/:id`, ({ params }) => {
    const { id } = params
    const student = studentsData.find(s => s.id === id)
    
    if (!student) {
      return HttpResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: student
    })
  }),

  // Create student endpoint
  http.post(`${API_CONFIG.BASE_URL}/api/students`, async ({ request }) => {
    const body = await request.json() as any
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.documentNumber) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          errors: {
            firstName: !body.firstName ? 'First name is required' : undefined,
            lastName: !body.lastName ? 'Last name is required' : undefined,
            email: !body.email ? 'Email is required' : undefined,
            documentNumber: !body.documentNumber ? 'Document number is required' : undefined
          }
        },
        { status: 400 }
      )
    }

    // Check for duplicate document number
    if (studentsData.some(s => s.documentNumber === body.documentNumber)) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Document number already exists',
          errors: { documentNumber: 'Este número de documento ya está registrado' }
        },
        { status: 409 }
      )
    }

    const newStudent = {
      id: `student-${studentsData.length + 1}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    studentsData.push(newStudent)

    return HttpResponse.json({
      success: true,
      data: newStudent,
      message: 'Student created successfully'
    }, { status: 201 })
  }),

  // Update student endpoint
  http.put(`${API_CONFIG.BASE_URL}/api/students/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    const index = studentsData.findIndex(s => s.id === id)

    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    const updatedStudent = {
      ...studentsData[index],
      ...body,
      updatedAt: new Date().toISOString()
    }

    studentsData[index] = updatedStudent

    return HttpResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully'
    })
  }),

  // Delete student endpoint
  http.delete(`${API_CONFIG.BASE_URL}/api/students/:id`, ({ params }) => {
    const { id } = params
    const index = studentsData.findIndex(s => s.id === id)

    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    studentsData.splice(index, 1)

    return HttpResponse.json({
      success: true,
      message: 'Student deleted successfully'
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

describe('Student Management Integration Tests', () => {
  beforeEach(() => {
    server.listen()
    // Set up authenticated state
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
    // Reset students data
    studentsData = [...mockStudents]
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  describe('Student List View', () => {
    it('should display student list and allow navigation', async () => {
      // Navigate to students page
      window.history.pushState({}, '', '/students')
      
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should display students list
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })

      // Should display student details
      expect(screen.getByText('juan.perez@sena.edu.co')).toBeInTheDocument()
      expect(screen.getByText('maria.garcia@sena.edu.co')).toBeInTheDocument()
      expect(screen.getByText('Sistemas')).toBeInTheDocument()
      expect(screen.getByText('Administración')).toBeInTheDocument()
    })

    it('should support student search functionality', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Find search input
      const searchInput = screen.getByPlaceholderText(/buscar estudiantes/i)
      
      // Search for specific student
      fireEvent.change(searchInput, { target: { value: 'Juan' } })
      fireEvent.submit(searchInput.closest('form')!)

      // Should show only matching results
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.queryByText('María García')).not.toBeInTheDocument()
      })

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } })
      fireEvent.submit(searchInput.closest('form')!)

      // Should show all students again
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })
  })

  describe('Student Creation Flow', () => {
    it('should complete student creation workflow', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Click create student button
      const createButton = await screen.findByRole('button', { name: /nuevo estudiante/i })
      fireEvent.click(createButton)

      // Should navigate to create form
      await waitFor(() => {
        expect(screen.getByText(/crear estudiante/i)).toBeInTheDocument()
      })

      // Fill student form
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Carlos' }
      })
      fireEvent.change(screen.getByLabelText(/apellido/i), {
        target: { value: 'López' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'carlos.lopez@sena.edu.co' }
      })
      fireEvent.change(screen.getByLabelText(/documento/i), {
        target: { value: '1122334455' }
      })
      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: '3001122334' }
      })
      fireEvent.change(screen.getByLabelText(/programa/i), {
        target: { value: 'Mecánica' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/estudiante creado exitosamente/i)).toBeInTheDocument()
      })

      // Should redirect to student list
      await waitFor(() => {
        expect(screen.getByText('Carlos López')).toBeInTheDocument()
      })
    })

    it('should handle validation errors in creation form', async () => {
      window.history.pushState({}, '', '/students/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Try to submit empty form
      const submitButton = await screen.findByRole('button', { name: /guardar/i })
      fireEvent.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument()
        expect(screen.getByText(/apellido es requerido/i)).toBeInTheDocument()
        expect(screen.getByText(/email es requerido/i)).toBeInTheDocument()
      })
    })

    it('should handle duplicate document number error', async () => {
      window.history.pushState({}, '', '/students/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Fill form with duplicate document number
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Test' }
      })
      fireEvent.change(screen.getByLabelText(/apellido/i), {
        target: { value: 'User' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@sena.edu.co' }
      })
      fireEvent.change(screen.getByLabelText(/documento/i), {
        target: { value: '1234567890' } // Duplicate number
      })

      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

      // Should show duplicate error
      await waitFor(() => {
        expect(screen.getByText(/número de documento ya está registrado/i)).toBeInTheDocument()
      })
    })
  })

  describe('Student Edit Flow', () => {
    it('should complete student update workflow', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Wait for students to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Find and click edit button for first student
      const studentRow = screen.getByText('Juan Pérez').closest('tr')!
      const editButton = within(studentRow).getByRole('button', { name: /editar/i })
      fireEvent.click(editButton)

      // Should navigate to edit form
      await waitFor(() => {
        expect(screen.getByText(/editar estudiante/i)).toBeInTheDocument()
      })

      // Form should be pre-filled
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument()

      // Update student info
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Juan Carlos' }
      })
      fireEvent.change(screen.getByLabelText(/semestre/i), {
        target: { value: '2' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/estudiante actualizado exitosamente/i)).toBeInTheDocument()
      })

      // Should redirect to list with updated data
      await waitFor(() => {
        expect(screen.getByText('Juan Carlos Pérez')).toBeInTheDocument()
      })
    })
  })

  describe('Student Delete Flow', () => {
    it('should complete student deletion workflow', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Wait for students to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Find and click delete button
      const studentRow = screen.getByText('Juan Pérez').closest('tr')!
      const deleteButton = within(studentRow).getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument()
      })

      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/estudiante eliminado exitosamente/i)).toBeInTheDocument()
      })

      // Student should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should allow canceling deletion', async () => {
      window.history.pushState({}, '', '/students')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Click delete button
      const studentRow = screen.getByText('Juan Pérez').closest('tr')!
      const deleteButton = within(studentRow).getByRole('button', { name: /eliminar/i })
      fireEvent.click(deleteButton)

      // Cancel deletion
      await waitFor(() => {
        expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

      // Student should still be in list
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })
    })
  })

  describe('Student Detail View', () => {
    it('should display detailed student information', async () => {
      window.history.pushState({}, '', '/students/student-1')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should display student details
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('juan.perez@sena.edu.co')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('Sistemas')).toBeInTheDocument()
        expect(screen.getByText('3001234567')).toBeInTheDocument()
      })

      // Should have action buttons
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
    })
  })
})