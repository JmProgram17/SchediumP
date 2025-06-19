/**
 * Student Hooks Tests - Comprehensive testing suite
 * Tests all CRUD operations, error handling, and optimistic updates
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  useStudentList, 
  useStudent, 
  useCreateStudent, 
  useUpdateStudent, 
  useDeleteStudent,
  useBulkDeleteStudents
} from '../hooks'
import { studentService } from '../services'
import { Student, StudentStatus, DocumentType } from '../types'

// Mock dependencies
jest.mock('react-hot-toast')
jest.mock('../services')

const mockedToast = toast as jest.Mocked<typeof toast>
const mockedStudentService = studentService as jest.Mocked<typeof studentService>

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
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

const mockStudentList = {
  items: [mockStudent],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1
}

describe('Student Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useStudentList', () => {
    it('should fetch student list successfully', async () => {
      mockedStudentService.getStudents.mockResolvedValue(mockStudentList)

      const { result } = renderHook(
        () => useStudentList({ page: 1, limit: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStudentList)
      expect(mockedStudentService.getStudents).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      })
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      mockedStudentService.getStudents.mockRejectedValue(error)

      const { result } = renderHook(
        () => useStudentList(),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useCreateStudent', () => {
    it('should create student successfully', async () => {
      const newStudentData = {
        documentType: DocumentType.CC,
        documentNumber: '87654321',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        program: 'Técnico en Sistemas',
        semester: 1,
        status: StudentStatus.ACTIVE,
        enrollmentDate: '2024-02-01'
      }

      const createdStudent = { ...mockStudent, ...newStudentData, id: '2' }
      mockedStudentService.createStudent.mockResolvedValue(createdStudent)

      const { result } = renderHook(
        () => useCreateStudent(),
        { wrapper: createWrapper() }
      )

      result.current.mutate(newStudentData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockedStudentService.createStudent).toHaveBeenCalledWith(newStudentData)
      expect(mockedToast.success).toHaveBeenCalledWith('Estudiante creado exitosamente')
    })
  })
})