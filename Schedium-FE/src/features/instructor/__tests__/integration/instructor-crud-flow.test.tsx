/**
 * Instructor CRUD Integration Tests
 * Tests complete user flows for Instructor module
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { InstructorList } from '../../components/InstructorList'
import { InstructorForm } from '../../components/InstructorForm'
import { InstructorDetail } from '../../components/InstructorDetail'
import { Instructor, InstructorStatus, DocumentType, ContractType } from '../../types'

// Mock data
const mockInstructors: Instructor[] = [
  {
    id: '1',
    documentType: DocumentType.CC,
    documentNumber: '12345678',
    firstName: 'Dr. Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@university.edu',
    phone: '3001234567',
    specialization: 'Ingeniería de Software',
    department: 'Facultad de Ingeniería',
    contractType: ContractType.PLANTA,
    status: InstructorStatus.ACTIVE,
    hireDate: '2020-01-15',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    documentType: DocumentType.CC,
    documentNumber: '87654321',
    firstName: 'Dra. Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@university.edu',
    phone: '3109876543',
    specialization: 'Matemáticas Aplicadas',
    department: 'Facultad de Ciencias',
    contractType: ContractType.CONTRATO,
    status: InstructorStatus.ACTIVE,
    hireDate: '2021-08-20',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

// MSW Server setup
const server = setupServer(
  rest.get('/api/v1/hr/instructors', (req, res, ctx) => {
    const search = req.url.searchParams.get('search')
    
    let filteredInstructors = mockInstructors
    if (search) {
      filteredInstructors = mockInstructors.filter(instructor => 
        instructor.firstName.toLowerCase().includes(search.toLowerCase()) ||
        instructor.lastName.toLowerCase().includes(search.toLowerCase()) ||
        instructor.email.toLowerCase().includes(search.toLowerCase()) ||
        instructor.specialization.toLowerCase().includes(search.toLowerCase())
      )
    }

    return res(
      ctx.json({
        items: filteredInstructors,
        total: filteredInstructors.length,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    )
  }),

  rest.get('/api/v1/hr/instructors/:id', (req, res, ctx) => {
    const { id } = req.params
    const instructor = mockInstructors.find(i => i.id === id)
    
    if (!instructor) {
      return res(ctx.status(404), ctx.json({ error: 'Instructor not found' }))
    }

    return res(ctx.json({ data: instructor }))
  }),

  rest.post('/api/v1/hr/instructors', (req, res, ctx) => {
    const newInstructor = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockInstructors.push(newInstructor as Instructor)
    return res(ctx.json({ data: newInstructor }))
  }),

  rest.put('/api/v1/hr/instructors/:id', (req, res, ctx) => {
    const { id } = req.params
    const instructorIndex = mockInstructors.findIndex(i => i.id === id)
    
    if (instructorIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Instructor not found' }))
    }

    const updatedInstructor = {
      ...mockInstructors[instructorIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    }

    mockInstructors[instructorIndex] = updatedInstructor
    return res(ctx.json({ data: updatedInstructor }))
  }),

  rest.delete('/api/v1/hr/instructors/:id', (req, res, ctx) => {
    const { id } = req.params
    const instructorIndex = mockInstructors.findIndex(i => i.id === id)
    
    if (instructorIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Instructor not found' }))
    }

    mockInstructors.splice(instructorIndex, 1)
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

describe('Instructor CRUD Integration Tests', () => {
  describe('InstructorList', () => {
    it('should display list of instructors', async () => {
      renderWithProviders(<InstructorList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
        expect(screen.getByText('Dra. Ana Martínez')).toBeInTheDocument()
      })

      expect(screen.getByText('2 instructores registrados')).toBeInTheDocument()
    })

    it('should filter instructors by search term', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InstructorList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i)
      await user.type(searchInput, 'Carlos')

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
        expect(screen.queryByText('Dra. Ana Martínez')).not.toBeInTheDocument()
      })
    })

    it('should display contract type and status badges', async () => {
      renderWithProviders(<InstructorList />)

      await waitFor(() => {
        expect(screen.getByText('PLANTA')).toBeInTheDocument()
        expect(screen.getByText('CONTRATO')).toBeInTheDocument()
        expect(screen.getAllByText('ACTIVE')).toHaveLength(2)
      })
    })
  })

  describe('InstructorForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
      mockOnClose.mockClear()
      mockOnSuccess.mockClear()
    })

    it('should create new instructor with all required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <InstructorForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Fill form fields
      await user.type(screen.getByLabelText(/número de documento/i), '11111111')
      await user.type(screen.getByLabelText(/nombres/i), 'Prof. Luis')
      await user.type(screen.getByLabelText(/apellidos/i), 'González')
      await user.type(screen.getByLabelText(/email/i), 'luis.gonzalez@university.edu')
      await user.type(screen.getByLabelText(/teléfono/i), '3151234567')
      await user.type(screen.getByLabelText(/especialización/i), 'Física Cuántica')
      await user.type(screen.getByLabelText(/departamento/i), 'Facultad de Ciencias')
      await user.selectOptions(screen.getByLabelText(/tipo de contrato/i), ContractType.CATEDRA)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should edit existing instructor', async () => {
      const user = userEvent.setup()
      const existingInstructor = mockInstructors[0]
      
      renderWithProviders(
        <InstructorForm 
          instructor={existingInstructor}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Verify form is pre-filled
      expect(screen.getByDisplayValue('Dr. Carlos')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Rodríguez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Ingeniería de Software')).toBeInTheDocument()

      // Modify specialization
      const specializationInput = screen.getByDisplayValue('Ingeniería de Software')
      await user.clear(specializationInput)
      await user.type(specializationInput, 'Inteligencia Artificial')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /actualizar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <InstructorForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Fill basic fields
      await user.type(screen.getByLabelText(/número de documento/i), '11111111')
      await user.type(screen.getByLabelText(/nombres/i), 'Test')
      await user.type(screen.getByLabelText(/apellidos/i), 'User')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should validate phone number format', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <InstructorForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Fill required fields with invalid phone
      await user.type(screen.getByLabelText(/número de documento/i), '11111111')
      await user.type(screen.getByLabelText(/nombres/i), 'Test')
      await user.type(screen.getByLabelText(/apellidos/i), 'User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/teléfono/i), '123') // Invalid phone
      
      const submitButton = screen.getByRole('button', { name: /crear/i })
      await user.click(submitButton)

      // Should show phone validation error
      await waitFor(() => {
        expect(screen.getByText(/teléfono debe tener 10 dígitos/i)).toBeInTheDocument()
      })
    })
  })

  describe('InstructorDetail', () => {
    it('should display instructor details with professional information', async () => {
      renderWithProviders(<InstructorDetail instructorId="1" />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
        expect(screen.getByText('carlos.rodriguez@university.edu')).toBeInTheDocument()
        expect(screen.getByText('Ingeniería de Software')).toBeInTheDocument()
        expect(screen.getByText('Facultad de Ingeniería')).toBeInTheDocument()
        expect(screen.getByText('PLANTA')).toBeInTheDocument()
      })
    })

    it('should display hire date in correct format', async () => {
      renderWithProviders(<InstructorDetail instructorId="1" />)

      await waitFor(() => {
        // Should format date in Spanish locale
        expect(screen.getByText(/15 de enero de 2020/i)).toBeInTheDocument()
      })
    })

    it('should handle instructor not found', async () => {
      renderWithProviders(<InstructorDetail instructorId="999" />)

      await waitFor(() => {
        expect(screen.getByText('Instructor no encontrado')).toBeInTheDocument()
      })
    })

    it('should open edit form when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InstructorDetail instructorId="1" />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /editar/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Editar Instructor')).toBeInTheDocument()
      })
    })
  })

  describe('Instructor Status and Contract Type Management', () => {
    it('should handle different contract types correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <InstructorForm 
          onClose={() => {}} 
          onSuccess={() => {}} 
        />
      )

      const contractSelect = screen.getByLabelText(/tipo de contrato/i)
      
      // Test all contract types
      await user.selectOptions(contractSelect, ContractType.PLANTA)
      expect(screen.getByDisplayValue('PLANTA')).toBeInTheDocument()

      await user.selectOptions(contractSelect, ContractType.CONTRATO)
      expect(screen.getByDisplayValue('CONTRATO')).toBeInTheDocument()

      await user.selectOptions(contractSelect, ContractType.CATEDRA)
      expect(screen.getByDisplayValue('CATEDRA')).toBeInTheDocument()
    })

    it('should handle different instructor statuses', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <InstructorForm 
          onClose={() => {}} 
          onSuccess={() => {}} 
        />
      )

      const statusSelect = screen.getByLabelText(/estado/i)
      
      // Test all status types
      await user.selectOptions(statusSelect, InstructorStatus.ACTIVE)
      expect(screen.getByDisplayValue('ACTIVE')).toBeInTheDocument()

      await user.selectOptions(statusSelect, InstructorStatus.INACTIVE)
      expect(screen.getByDisplayValue('INACTIVE')).toBeInTheDocument()

      await user.selectOptions(statusSelect, InstructorStatus.SUSPENDED)
      expect(screen.getByDisplayValue('SUSPENDED')).toBeInTheDocument()
    })
  })

  describe('Bulk Operations', () => {
    it('should allow bulk selection of instructors', async () => {
      const user = userEvent.setup()
      renderWithProviders(<InstructorList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Carlos Rodríguez')).toBeInTheDocument()
      })

      // Select multiple instructors (checkboxes would be rendered in real implementation)
      const checkboxes = screen.getAllByRole('button', { name: /square/i })
      
      // This would trigger selection in real implementation
      // For now, we just verify the checkboxes exist
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('Export Functionality', () => {
    it('should have export button available', async () => {
      renderWithProviders(<InstructorList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
      })
    })
  })
})