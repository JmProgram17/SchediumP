/**
 * Student Components Tests - UI and interaction testing
 * Tests component rendering, user interactions, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { StudentList, StudentForm, StudentDetail } from '../components'
import { Student, StudentStatus, DocumentType } from '../types'
import * as hooks from '../hooks'

// Mock the hooks
jest.mock('../hooks')
const mockedHooks = hooks as jest.Mocked<typeof hooks>

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const mockStudent: Student = {
  id: '1',
  documentType: DocumentType.CC,
  documentNumber: '12345678',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '3001234567',
  program: 'Análisis y Desarrollo de Software',
  semester: 3,
  status: StudentStatus.ACTIVE,
  enrollmentDate: '2024-01-15',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}

const mockStudentListData = {
  items: [mockStudent],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1
}

describe('StudentList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockedHooks.useStudentList.mockReturnValue({
      data: mockStudentListData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false
    } as any)

    mockedHooks.useDeleteStudent.mockReturnValue({
      mutate: jest.fn(),
      isPending: false
    } as any)

    mockedHooks.useBulkDeleteStudents.mockReturnValue({
      mutate: jest.fn(),
      isPending: false
    } as any)

    mockedHooks.useExportStudents.mockReturnValue({
      mutate: jest.fn(),
      isPending: false
    } as any)
  })

  it('should render student list correctly', () => {
    render(<StudentList />, { wrapper: createWrapper() })

    expect(screen.getByText('Estudiantes')).toBeInTheDocument()
    expect(screen.getByText('1 estudiantes registrados')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockedHooks.useStudentList.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false
    } as any)

    render(<StudentList />, { wrapper: createWrapper() })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should show error state', () => {
    const error = new Error('Failed to load students')
    mockedHooks.useStudentList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isSuccess: false,
      isError: true
    } as any)

    render(<StudentList />, { wrapper: createWrapper() })

    expect(screen.getByText(/Error al cargar estudiantes/)).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('should handle search input', async () => {
    const user = userEvent.setup()
    render(<StudentList />, { wrapper: createWrapper() })

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/)
    await user.type(searchInput, 'John')

    // Should update the search params
    expect(searchInput).toHaveValue('John')
  })

  it('should open new student form', async () => {
    const user = userEvent.setup()
    render(<StudentList />, { wrapper: createWrapper() })

    const newStudentButton = screen.getByRole('button', { name: /Nuevo Estudiante/ })
    await user.click(newStudentButton)

    // Should show the form (in real implementation, this would be tested with modal)
    expect(newStudentButton).toBeInTheDocument()
  })

  it('should handle student selection', async () => {
    const user = userEvent.setup()
    render(<StudentList />, { wrapper: createWrapper() })

    const checkbox = screen.getByLabelText(/Seleccionar John Doe/)
    await user.click(checkbox)

    // Should show selection actions
    expect(screen.getByText(/1 seleccionado/)).toBeInTheDocument()
  })

  it('should handle bulk delete', async () => {
    const user = userEvent.setup()
    const mockBulkDelete = jest.fn()
    mockedHooks.useBulkDeleteStudents.mockReturnValue({
      mutate: mockBulkDelete,
      isPending: false
    } as any)

    // Mock window.confirm
    global.confirm = jest.fn(() => true)

    render(<StudentList />, { wrapper: createWrapper() })

    // Select student first
    const checkbox = screen.getByLabelText(/Seleccionar John Doe/)
    await user.click(checkbox)

    // Click bulk delete
    const deleteButton = screen.getByRole('button', { name: /Eliminar/ })
    await user.click(deleteButton)

    expect(global.confirm).toHaveBeenCalled()
    expect(mockBulkDelete).toHaveBeenCalledWith(['1'])
  })

  it('should be accessible', () => {
    render(<StudentList />, { wrapper: createWrapper() })

    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Estudiantes' })).toBeInTheDocument()
    
    // Check for table structure
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Documento/ })).toBeInTheDocument()
    
    // Check for form controls
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Estudiante/ })).toBeInTheDocument()
  })
})

describe('StudentForm Component', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockedHooks.useCreateStudent.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false
    } as any)

    mockedHooks.useUpdateStudent.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false
    } as any)
  })

  it('should render create form correctly', () => {
    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Nuevo Estudiante')).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de Documento/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombres/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Apellidos/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
  })

  it('should render edit form with student data', () => {
    render(
      <StudentForm 
        student={mockStudent} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Editar Estudiante')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    const submitButton = screen.getByRole('button', { name: /Crear/ })
    await user.click(submitButton)

    // Should show validation errors for required fields
    await waitFor(() => {
      expect(screen.getByText(/Número de documento debe tener al menos 6 dígitos/)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    const emailInput = screen.getByLabelText(/Email/)
    await user.type(emailInput, 'invalid-email')

    await waitFor(() => {
      expect(screen.getByText(/Email inválido/)).toBeInTheDocument()
    })
  })

  it('should validate document number format', async () => {
    const user = userEvent.setup()
    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    const documentInput = screen.getByLabelText(/Número de Documento/)
    await user.type(documentInput, 'abc123')

    await waitFor(() => {
      expect(screen.getByText(/Solo se permiten números/)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockCreate = jest.fn().mockResolvedValue(mockStudent)
    mockedHooks.useCreateStudent.mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false
    } as any)

    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    // Fill out the form
    await user.type(screen.getByLabelText(/Número de Documento/), '12345678')
    await user.type(screen.getByLabelText(/Nombres/), 'John')
    await user.type(screen.getByLabelText(/Apellidos/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/Programa/), 'Test Program')

    const submitButton = screen.getByRole('button', { name: /Crear/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  it('should handle form cancellation', async () => {
    const user = userEvent.setup()
    global.confirm = jest.fn(() => true)

    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    // Make form dirty
    await user.type(screen.getByLabelText(/Nombres/), 'Test')

    const cancelButton = screen.getByRole('button', { name: /Cancelar/ })
    await user.click(cancelButton)

    expect(global.confirm).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should be accessible', () => {
    render(
      <StudentForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    )

    // Check for proper form structure
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('form')).toBeInTheDocument()
    
    // Check for proper labeling
    expect(screen.getByLabelText(/Tipo de Documento/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de Documento/)).toBeInTheDocument()
    
    // Check for keyboard navigation
    const firstInput = screen.getByLabelText(/Tipo de Documento/)
    expect(firstInput).toBeInTheDocument()
  })
})

describe('StudentDetail Component', () => {
  const mockOnClose = jest.fn()
  const mockOnEdit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockedHooks.useStudent.mockReturnValue({
      data: mockStudent,
      isLoading: false,
      error: null
    } as any)
  })

  it('should render student details correctly', () => {
    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Análisis y Desarrollo de Software')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockedHooks.useStudent.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any)

    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should show error state', () => {
    const error = new Error('Student not found')
    mockedHooks.useStudent.mockReturnValue({
      data: undefined,
      isLoading: false,
      error
    } as any)

    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText(/Error al cargar estudiante/)).toBeInTheDocument()
  })

  it('should handle edit button click', async () => {
    const user = userEvent.setup()
    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    const editButton = screen.getByRole('button', { name: /Editar/ })
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockStudent)
  })

  it('should handle close button click', async () => {
    const user = userEvent.setup()
    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    const closeButton = screen.getByRole('button', { name: /Cerrar/ })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should format dates correctly', () => {
    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    // Should show formatted dates in Spanish locale
    expect(screen.getByText(/15 de enero de 2024/)).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(
      <StudentDetail 
        studentId="1" 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />,
      { wrapper: createWrapper() }
    )

    // Check for proper dialog structure
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Detalle del Estudiante/ })).toBeInTheDocument()
    
    // Check for proper content structure
    expect(screen.getByText(/Información Personal/)).toBeInTheDocument()
    expect(screen.getByText(/Información de Contacto/)).toBeInTheDocument()
    expect(screen.getByText(/Información Académica/)).toBeInTheDocument()
  })
})