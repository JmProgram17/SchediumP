/**
 * Student Hooks Unit Tests
 * Comprehensive testing of student-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useStudentList,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent
} from '../index'
import { studentService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  studentService: {
    getStudents: vi.fn(),
    getStudent: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    bulkDeleteStudents: vi.fn(),
    bulkUpdateStudents: vi.fn(),
    exportStudents: vi.fn()
  }
}))

// Test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Student Hooks', () => {
  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    wrapper = createTestWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('useStudentList', () => {
    it('should fetch student list successfully', async () => {
      const mockStudents = {
        data: [
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
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }

      vi.mocked(studentService.getStudents).mockResolvedValue(mockStudents)

      const { result } = renderHook(() => useStudentList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStudents)
      expect(studentService.getStudents).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(studentService.getStudents).mockRejectedValue(mockError)

      const { result } = renderHook(() => useStudentList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass search parameters correctly', async () => {
      const query = { search: 'Juan', status: 'ACTIVE' as const }
      vi.mocked(studentService.getStudents).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useStudentList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(studentService.getStudents).toHaveBeenCalledWith(query)
    })
  })

  describe('useStudent', () => {
    const mockStudent = {
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@sena.edu.co',
      documentType: 'CC' as const,
      documentNumber: '1234567890',
      program: 'Sistemas',
      semester: 1,
      status: 'ACTIVE' as const,
      phone: '3001234567',
      enrollmentDate: '2024-01-15T00:00:00Z',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single student successfully', async () => {
      vi.mocked(studentService.getStudent).mockResolvedValue(mockStudent)

      const { result } = renderHook(() => useStudent('student-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStudent)
      expect(studentService.getStudent).toHaveBeenCalledWith('student-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useStudent(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(studentService.getStudent).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useStudent('student-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(studentService.getStudent).not.toHaveBeenCalled()
    })
  })

  describe('useCreateStudent', () => {
    it('should create student successfully', async () => {
      const newStudent = {
        documentType: 'CC' as const,
        documentNumber: '1234567890',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@sena.edu.co',
        phone: '3001234567',
        program: 'Sistemas',
        semester: 1,
        status: 'ACTIVE' as const,
        enrollmentDate: '2024-01-15T00:00:00Z'
      }

      const createdStudent = {
        id: 'student-new',
        ...newStudent,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(studentService.createStudent).mockResolvedValue(createdStudent)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateStudent(), { wrapper })

      result.current.mutate(newStudent)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(studentService.createStudent).toHaveBeenCalledWith(newStudent)
      expect(toast.success).toHaveBeenCalledWith('Estudiante creado exitosamente')
      expect(result.current.data).toEqual(createdStudent)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Validation error')
      vi.mocked(studentService.createStudent).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateStudent(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Validation error')
    })
  })

  describe('useUpdateStudent', () => {
    it('should update student successfully', async () => {
      const updateData = {
        firstName: 'Juan Carlos',
        semester: 2
      }

      const updatedStudent = {
        id: 'student-1',
        firstName: 'Juan Carlos',
        lastName: 'Pérez',
        email: 'juan.perez@sena.edu.co',
        documentType: 'CC' as const,
        documentNumber: '1234567890',
        program: 'Sistemas',
        semester: 2,
        status: 'ACTIVE' as const,
        phone: '3001234567',
        enrollmentDate: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(studentService.updateStudent).mockResolvedValue(updatedStudent)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateStudent(), { wrapper })

      result.current.mutate({ id: 'student-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(studentService.updateStudent).toHaveBeenCalledWith('student-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Estudiante actualizado exitosamente')
      expect(result.current.data).toEqual(updatedStudent)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Update failed')
      vi.mocked(studentService.updateStudent).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateStudent(), { wrapper })

      result.current.mutate({ id: 'student-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteStudent', () => {
    it('should delete student successfully', async () => {
      vi.mocked(studentService.deleteStudent).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteStudent(), { wrapper })

      result.current.mutate('student-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(studentService.deleteStudent).toHaveBeenCalledWith('student-1')
      expect(toast.success).toHaveBeenCalledWith('Estudiante eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Delete failed')
      vi.mocked(studentService.deleteStudent).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteStudent(), { wrapper })

      result.current.mutate('student-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Delete failed')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockStudent = {
        id: 'student-new',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@sena.edu.co',
        documentType: 'CC' as const,
        documentNumber: '1234567890',
        program: 'Sistemas',
        semester: 1,
        status: 'ACTIVE' as const,
        phone: '3001234567',
        enrollmentDate: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(studentService.createStudent).mockResolvedValue(mockStudent)
      vi.mocked(studentService.getStudents).mockResolvedValue({ 
        data: [mockStudent], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateStudent(), { wrapper })
      const { result: listResult } = renderHook(() => useStudentList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new student
      createResult.current.mutate({
        documentType: 'CC',
        documentNumber: '1234567890',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@sena.edu.co',
        phone: '3001234567',
        program: 'Sistemas',
        semester: 1,
        status: 'ACTIVE',
        enrollmentDate: '2024-01-15T00:00:00Z'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(studentService.getStudents).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout')
      vi.mocked(studentService.getStudents).mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useStudentList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(timeoutError)
    })

    it('should handle malformed API responses', async () => {
      const malformedError = new Error('Invalid JSON response')
      vi.mocked(studentService.getStudent).mockRejectedValue(malformedError)

      const { result } = renderHook(() => useStudent('student-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(malformedError)
    })
  })
})