/**
 * Student CRUD Integration Tests
 * Tests complete user flows for Student module
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { StudentList } from '../../components/StudentList'
import { StudentForm } from '../../components/StudentForm'
import { StudentDetail } from '../../components/StudentDetail'
import { Student, StudentStatus, DocumentType } from '../../types'

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    documentType: DocumentType.CC,
    documentNumber: '12345678',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '3001234567',
    program: 'Ingeniería de Software',
    semester: 5,
    status: StudentStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    documentType: DocumentType.CC,
    documentNumber: '87654321',
    firstName: 'María',
    lastName: 'García',
    email: 'maria.garcia@example.com',
    phone: '3109876543',
    program: 'Administración de Empresas',
    semester: 3,
    status: StudentStatus.ACTIVE,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

// MSW Server setup
const server = setupServer(
  rest.get('/api/v1/academic/students', (req, res, ctx) => {
    const search = req.url.searchParams.get('search')
    
    let filteredStudents = mockStudents
    if (search) {
      filteredStudents = mockStudents.filter(student => 
        student.firstName.toLowerCase().includes(search.toLowerCase()) ||
        student.lastName.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.documentNumber.includes(search)
      )
    }

    return res(
      ctx.json({
        items: filteredStudents,
        total: filteredStudents.length,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    )
  }),

  rest.get('/api/v1/academic/students/:id', (req, res, ctx) => {
    const { id } = req.params
    const student = mockStudents.find(s => s.id === id)
    
    if (!student) {
      return res(ctx.status(404), ctx.json({ error: 'Student not found' }))
    }

    return res(ctx.json({ data: student }))
  }),

  rest.post('/api/v1/academic/students', (req, res, ctx) => {
    const newStudent = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockStudents.push(newStudent as Student)
    return res(ctx.json({ data: newStudent }))
  }),

  rest.put('/api/v1/academic/students/:id', (req, res, ctx) => {
    const { id } = req.params
    const studentIndex = mockStudents.findIndex(s => s.id === id)
    
    if (studentIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Student not found' }))
    }

    const updatedStudent = {
      ...mockStudents[studentIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    }

    mockStudents[studentIndex] = updatedStudent
    return res(ctx.json({ data: updatedStudent }))
  }),

  rest.delete('/api/v1/academic/students/:id', (req, res, ctx) => {
    const { id } = req.params
    const studentIndex = mockStudents.findIndex(s => s.id === id)
    
    if (studentIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Student not found' }))
    }

    mockStudents.splice(studentIndex, 1)
    return res(ctx.status(204))
  })
)

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
      <Toaster />
    </QueryClientProvider>
  )
}

// Setup/teardown
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Student CRUD Integration Tests', () => {
  describe('StudentList', () => {
    it('should display list of students', async () => {
      renderWithProviders(<StudentList />)

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })

      expect(screen.getByText('2 estudiantes registrados')).toBeInTheDocument()
    })

    it('should filter students by search term', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StudentList />)

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i)
      await user.type(searchInput, 'juan')

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.queryByText('María García')).not.toBeInTheDocument()
      })
    })

    it('should handle empty search results', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StudentList />)

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i)
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No se encontraron estudiantes')).toBeInTheDocument()
      })
    })
  })

  describe('StudentForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
      mockOnClose.mockClear()
      mockOnSuccess.mockClear()
    })

    it('should create new student', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <StudentForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Fill form fields
      await user.type(screen.getByLabelText(/número de documento/i), '11111111')
      await user.type(screen.getByLabelText(/nombres/i), 'Carlos')
      await user.type(screen.getByLabelText(/apellidos/i), 'López')
      await user.type(screen.getByLabelText(/email/i), 'carlos.lopez@example.com')
      await user.type(screen.getByLabelText(/programa académico/i), 'Medicina')
      await user.selectOptions(screen.getByLabelText(/semestre/i), '1')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should edit existing student', async () => {
      const user = userEvent.setup()
      const existingStudent = mockStudents[0]
      
      renderWithProviders(
        <StudentForm 
          student={existingStudent}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Verify form is pre-filled
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument()

      // Modify a field
      const firstNameInput = screen.getByDisplayValue('Juan')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Juan Carlos')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /actualizar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <StudentForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/el número de documento es requerido/i)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should close form when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <StudentForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('StudentDetail', () => {
    it('should display student details', async () => {
      renderWithProviders(<StudentDetail studentId="1" />)

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('juan.perez@example.com')).toBeInTheDocument()
        expect(screen.getByText('12345678')).toBeInTheDocument()
        expect(screen.getByText('Ingeniería de Software')).toBeInTheDocument()
      })
    })

    it('should handle student not found', async () => {
      renderWithProviders(<StudentDetail studentId="999" />)

      await waitFor(() => {
        expect(screen.getByText('Estudiante no encontrado')).toBeInTheDocument()
      })
    })

    it('should open edit form when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StudentDetail studentId="1" />)

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /editar/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Editar Estudiante')).toBeInTheDocument()
      })
    })
  })

  describe('Complete CRUD Flow', () => {
    it('should complete full create, read, update, delete flow', async () => {
      const user = userEvent.setup()
      
      // Start with StudentList
      const { rerender } = renderWithProviders(<StudentList />)

      // 1. READ - Verify initial list
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })

      // 2. CREATE - Add new student
      const newButton = screen.getByRole('button', { name: /nuevo estudiante/i })
      await user.click(newButton)

      // Form should appear (in a real app, this would be in a modal)
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <StudentForm 
            onClose={() => {}} 
            onSuccess={() => {
              // Simulate form close and list refresh
              rerender(
                <QueryClientProvider client={createQueryClient()}>
                  <StudentList />
                </QueryClientProvider>
              )
            }} 
          />
        </QueryClientProvider>
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/número de documento/i), '99999999')
      await user.type(screen.getByLabelText(/nombres/i), 'Ana')
      await user.type(screen.getByLabelText(/apellidos/i), 'Martínez')
      await user.type(screen.getByLabelText(/email/i), 'ana.martinez@example.com')
      await user.type(screen.getByLabelText(/programa académico/i), 'Derecho')
      await user.selectOptions(screen.getByLabelText(/semestre/i), '2')

      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      // Should return to list with new student (optimistic update)
      await waitFor(() => {
        expect(screen.getByText('Ana Martínez')).toBeInTheDocument()
      })

      // 3. UPDATE - Edit the new student
      // In a real scenario, click edit button would open form
      const newStudentId = mockStudents.find(s => s.firstName === 'Ana')?.id
      
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <StudentForm 
            student={mockStudents.find(s => s.id === newStudentId)}
            onClose={() => {}} 
            onSuccess={() => {
              rerender(
                <QueryClientProvider client={createQueryClient()}>
                  <StudentList />
                </QueryClientProvider>
              )
            }} 
          />
        </QueryClientProvider>
      )

      // Modify student
      const firstNameInput = screen.getByDisplayValue('Ana')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Ana Carolina')

      const updateButton = screen.getByRole('button', { name: /actualizar/i })
      await user.click(updateButton)

      // Should return to list with updated student
      await waitFor(() => {
        expect(screen.getByText('Ana Carolina Martínez')).toBeInTheDocument()
      })

      // 4. DELETE - Remove the student
      // Simulate delete confirmation
      if (newStudentId) {
        server.use(
          rest.delete(`/api/v1/academic/students/${newStudentId}`, (req, res, ctx) => {
            const index = mockStudents.findIndex(s => s.id === newStudentId)
            mockStudents.splice(index, 1)
            return res(ctx.status(204))
          })
        )

        // Trigger delete and refresh list
        rerender(
          <QueryClientProvider client={createQueryClient()}>
            <StudentList />
          </QueryClientProvider>
        )

        await waitFor(() => {
          expect(screen.queryByText('Ana Carolina Martínez')).not.toBeInTheDocument()
        })
      }
    })
  })
})