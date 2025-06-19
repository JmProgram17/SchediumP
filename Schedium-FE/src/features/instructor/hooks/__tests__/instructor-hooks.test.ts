/**
 * Instructor Hooks Unit Tests
 * Comprehensive testing of instructor-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useInstructorList,
  useInstructor,
  useCreateInstructor,
  useUpdateInstructor,
  useDeleteInstructor
} from '../index'
import { instructorService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  instructorService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteItem: vi.fn()
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

describe('Instructor Hooks', () => {
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

  describe('useInstructorList', () => {
    it('should fetch instructor list successfully', async () => {
      const mockInstructors = {
        data: [
          {
            id: 'instructor-1',
            firstName: 'Pedro',
            lastName: 'Hernández',
            email: 'pedro.hernandez@sena.edu.co',
            documentType: 'CC',
            documentNumber: '20000001',
            specialization: 'Sistemas',
            department: 'Informática',
            contractType: 'PLANTA',
            status: 'ACTIVE',
            phone: '3101234567',
            hireDate: '2020-01-15T00:00:00Z',
            createdAt: '2020-01-15T00:00:00Z',
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

      vi.mocked(instructorService.getList).mockResolvedValue(mockInstructors)

      const { result } = renderHook(() => useInstructorList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockInstructors)
      expect(instructorService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(instructorService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useInstructorList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass department filter correctly', async () => {
      const query = { department: 'Informática', status: 'ACTIVE' as const }
      vi.mocked(instructorService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useInstructorList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(instructorService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useInstructor', () => {
    const mockInstructor = {
      id: 'instructor-1',
      firstName: 'Pedro',
      lastName: 'Hernández',
      email: 'pedro.hernandez@sena.edu.co',
      documentType: 'CC' as const,
      documentNumber: '20000001',
      specialization: 'Sistemas',
      department: 'Informática',
      contractType: 'PLANTA' as const,
      status: 'ACTIVE' as const,
      phone: '3101234567',
      hireDate: '2020-01-15T00:00:00Z',
      createdAt: '2020-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single instructor successfully', async () => {
      vi.mocked(instructorService.getById).mockResolvedValue(mockInstructor)

      const { result } = renderHook(() => useInstructor('instructor-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockInstructor)
      expect(instructorService.getById).toHaveBeenCalledWith('instructor-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useInstructor(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(instructorService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useInstructor('instructor-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(instructorService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateInstructor', () => {
    it('should create instructor successfully', async () => {
      const newInstructor = {
        documentType: 'CC' as const,
        documentNumber: '20000002',
        firstName: 'Laura',
        lastName: 'Jiménez',
        email: 'laura.jimenez@sena.edu.co',
        phone: '3102345678',
        specialization: 'Administración',
        department: 'Gestión',
        contractType: 'CONTRATO' as const,
        status: 'ACTIVE' as const,
        hireDate: '2024-01-15T00:00:00Z'
      }

      const createdInstructor = {
        id: 'instructor-new',
        ...newInstructor,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(instructorService.create).mockResolvedValue(createdInstructor)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateInstructor(), { wrapper })

      result.current.mutate(newInstructor)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(instructorService.create).toHaveBeenCalledWith(newInstructor)
      expect(toast.success).toHaveBeenCalledWith('Instructor creado exitosamente')
      expect(result.current.data).toEqual(createdInstructor)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Validation error')
      vi.mocked(instructorService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateInstructor(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Validation error')
    })
  })

  describe('useUpdateInstructor', () => {
    it('should update instructor successfully', async () => {
      const updateData = {
        firstName: 'Pedro Luis',
        specialization: 'Desarrollo de Software'
      }

      const updatedInstructor = {
        id: 'instructor-1',
        firstName: 'Pedro Luis',
        lastName: 'Hernández',
        email: 'pedro.hernandez@sena.edu.co',
        documentType: 'CC' as const,
        documentNumber: '20000001',
        specialization: 'Desarrollo de Software',
        department: 'Informática',
        contractType: 'PLANTA' as const,
        status: 'ACTIVE' as const,
        phone: '3101234567',
        hireDate: '2020-01-15T00:00:00Z',
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(instructorService.update).mockResolvedValue(updatedInstructor)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateInstructor(), { wrapper })

      result.current.mutate({ id: 'instructor-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(instructorService.update).toHaveBeenCalledWith('instructor-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Instructor actualizado exitosamente')
      expect(result.current.data).toEqual(updatedInstructor)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Update failed')
      vi.mocked(instructorService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateInstructor(), { wrapper })

      result.current.mutate({ id: 'instructor-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteInstructor', () => {
    it('should delete instructor successfully', async () => {
      vi.mocked(instructorService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteInstructor(), { wrapper })

      result.current.mutate('instructor-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(instructorService.deleteItem).toHaveBeenCalledWith('instructor-1')
      expect(toast.success).toHaveBeenCalledWith('Instructor eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Delete failed')
      vi.mocked(instructorService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteInstructor(), { wrapper })

      result.current.mutate('instructor-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Delete failed')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockInstructor = {
        id: 'instructor-new',
        firstName: 'Laura',
        lastName: 'Jiménez',
        email: 'laura.jimenez@sena.edu.co',
        documentType: 'CC' as const,
        documentNumber: '20000002',
        specialization: 'Administración',
        department: 'Gestión',
        contractType: 'CONTRATO' as const,
        status: 'ACTIVE' as const,
        phone: '3102345678',
        hireDate: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(instructorService.create).mockResolvedValue(mockInstructor)
      vi.mocked(instructorService.getList).mockResolvedValue({ 
        data: [mockInstructor], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateInstructor(), { wrapper })
      const { result: listResult } = renderHook(() => useInstructorList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new instructor
      createResult.current.mutate({
        documentType: 'CC',
        documentNumber: '20000002',
        firstName: 'Laura',
        lastName: 'Jiménez',
        email: 'laura.jimenez@sena.edu.co',
        phone: '3102345678',
        specialization: 'Administración',
        department: 'Gestión',
        contractType: 'CONTRATO',
        status: 'ACTIVE',
        hireDate: '2024-01-15T00:00:00Z'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(instructorService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout')
      vi.mocked(instructorService.getList).mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useInstructorList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(timeoutError)
    })

    it('should handle contract type validation', async () => {
      const validationError = new Error('Invalid contract type')
      vi.mocked(instructorService.create).mockRejectedValue(validationError)

      const { result } = renderHook(() => useCreateInstructor(), { wrapper })

      result.current.mutate({
        documentType: 'CC',
        documentNumber: '20000003',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@sena.edu.co',
        phone: '3001234567',
        specialization: 'Test',
        department: 'Test',
        contractType: 'INVALID' as any,
        status: 'ACTIVE',
        hireDate: '2024-01-15T00:00:00Z'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(validationError)
    })
  })
})