/**
 * Enrollment Hooks Unit Tests
 * Comprehensive testing of enrollment-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useEnrollmentList,
  useEnrollment,
  useCreateEnrollment,
  useUpdateEnrollment,
  useDeleteEnrollment
} from '../index'
import { enrollmentService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  enrollmentService: {
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

describe('Enrollment Hooks', () => {
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

  describe('useEnrollmentList', () => {
    it('should fetch enrollment list successfully', async () => {
      const mockEnrollments = {
        data: [
          {
            id: 'enrollment-1',
            studentId: 'student-1',
            scheduleId: 'schedule-1',
            enrollmentDate: '2024-02-01T00:00:00Z',
            status: 'ENROLLED',
            grade: null,
            attendance: null,
            createdAt: '2024-02-01T00:00:00Z',
            updatedAt: '2024-02-01T00:00:00Z'
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

      vi.mocked(enrollmentService.getList).mockResolvedValue(mockEnrollments)

      const { result } = renderHook(() => useEnrollmentList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockEnrollments)
      expect(enrollmentService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(enrollmentService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useEnrollmentList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass student filter correctly', async () => {
      const query = { studentId: 'student-1', status: 'ENROLLED' as const }
      vi.mocked(enrollmentService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useEnrollmentList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(enrollmentService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useEnrollment', () => {
    const mockEnrollment = {
      id: 'enrollment-1',
      studentId: 'student-1',
      scheduleId: 'schedule-1',
      enrollmentDate: '2024-02-01T00:00:00Z',
      status: 'ENROLLED' as const,
      grade: null as number | null,
      attendance: null as number | null,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z'
    }

    it('should fetch single enrollment successfully', async () => {
      vi.mocked(enrollmentService.getById).mockResolvedValue(mockEnrollment)

      const { result } = renderHook(() => useEnrollment('enrollment-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockEnrollment)
      expect(enrollmentService.getById).toHaveBeenCalledWith('enrollment-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useEnrollment(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(enrollmentService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useEnrollment('enrollment-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(enrollmentService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateEnrollment', () => {
    it('should create enrollment successfully', async () => {
      const newEnrollment = {
        studentId: 'student-2',
        scheduleId: 'schedule-2',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'ENROLLED' as const,
        grade: null as number | null,
        attendance: null as number | null
      }

      const createdEnrollment = {
        id: 'enrollment-new',
        ...newEnrollment,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      }

      vi.mocked(enrollmentService.create).mockResolvedValue(createdEnrollment)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateEnrollment(), { wrapper })

      result.current.mutate(newEnrollment)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(enrollmentService.create).toHaveBeenCalledWith(newEnrollment)
      expect(toast.success).toHaveBeenCalledWith('Matrícula creado exitosamente')
      expect(result.current.data).toEqual(createdEnrollment)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Student already enrolled in this schedule')
      vi.mocked(enrollmentService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateEnrollment(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Student already enrolled in this schedule')
    })
  })

  describe('useUpdateEnrollment', () => {
    it('should update enrollment successfully', async () => {
      const updateData = {
        status: 'COMPLETED' as const,
        grade: 4.5,
        attendance: 95
      }

      const updatedEnrollment = {
        id: 'enrollment-1',
        studentId: 'student-1',
        scheduleId: 'schedule-1',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'COMPLETED' as const,
        grade: 4.5,
        attendance: 95,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z'
      }

      vi.mocked(enrollmentService.update).mockResolvedValue(updatedEnrollment)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateEnrollment(), { wrapper })

      result.current.mutate({ id: 'enrollment-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(enrollmentService.update).toHaveBeenCalledWith('enrollment-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Matrícula actualizado exitosamente')
      expect(result.current.data).toEqual(updatedEnrollment)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Invalid grade value')
      vi.mocked(enrollmentService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateEnrollment(), { wrapper })

      result.current.mutate({ id: 'enrollment-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid grade value')
    })
  })

  describe('useDeleteEnrollment', () => {
    it('should delete enrollment successfully', async () => {
      vi.mocked(enrollmentService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteEnrollment(), { wrapper })

      result.current.mutate('enrollment-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(enrollmentService.deleteItem).toHaveBeenCalledWith('enrollment-1')
      expect(toast.success).toHaveBeenCalledWith('Matrícula eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete completed enrollment')
      vi.mocked(enrollmentService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteEnrollment(), { wrapper })

      result.current.mutate('enrollment-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Cannot delete completed enrollment')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockEnrollment = {
        id: 'enrollment-new',
        studentId: 'student-2',
        scheduleId: 'schedule-2',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'ENROLLED' as const,
        grade: null as number | null,
        attendance: null as number | null,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      }

      vi.mocked(enrollmentService.create).mockResolvedValue(mockEnrollment)
      vi.mocked(enrollmentService.getList).mockResolvedValue({ 
        data: [mockEnrollment], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateEnrollment(), { wrapper })
      const { result: listResult } = renderHook(() => useEnrollmentList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new enrollment
      createResult.current.mutate({
        studentId: 'student-2',
        scheduleId: 'schedule-2',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'ENROLLED',
        grade: null,
        attendance: null
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(enrollmentService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid grade validation', async () => {
      const gradeError = new Error('Grade must be between 0 and 5')
      vi.mocked(enrollmentService.update).mockRejectedValue(gradeError)

      const { result } = renderHook(() => useUpdateEnrollment(), { wrapper })

      result.current.mutate({ 
        id: 'enrollment-1', 
        data: { grade: 6.0 } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(gradeError)
    })

    it('should handle invalid attendance validation', async () => {
      const attendanceError = new Error('Attendance must be between 0 and 100')
      vi.mocked(enrollmentService.update).mockRejectedValue(attendanceError)

      const { result } = renderHook(() => useUpdateEnrollment(), { wrapper })

      result.current.mutate({ 
        id: 'enrollment-1', 
        data: { attendance: 150 } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(attendanceError)
    })

    it('should handle schedule capacity exceeded', async () => {
      const capacityError = new Error('Schedule has reached maximum capacity')
      vi.mocked(enrollmentService.create).mockRejectedValue(capacityError)

      const { result } = renderHook(() => useCreateEnrollment(), { wrapper })

      result.current.mutate({
        studentId: 'student-3',
        scheduleId: 'full-schedule-1',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'ENROLLED',
        grade: null,
        attendance: null
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(capacityError)
    })

    it('should handle duplicate enrollment', async () => {
      const duplicateError = new Error('Student is already enrolled in this schedule')
      vi.mocked(enrollmentService.create).mockRejectedValue(duplicateError)

      const { result } = renderHook(() => useCreateEnrollment(), { wrapper })

      result.current.mutate({
        studentId: 'student-1',
        scheduleId: 'schedule-1',
        enrollmentDate: '2024-02-01T00:00:00Z',
        status: 'ENROLLED',
        grade: null,
        attendance: null
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(duplicateError)
    })

    it('should handle invalid status transition', async () => {
      const statusError = new Error('Invalid status transition from COMPLETED to ENROLLED')
      vi.mocked(enrollmentService.update).mockRejectedValue(statusError)

      const { result } = renderHook(() => useUpdateEnrollment(), { wrapper })

      result.current.mutate({ 
        id: 'enrollment-1', 
        data: { status: 'ENROLLED' } // Trying to go from COMPLETED back to ENROLLED
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(statusError)
    })
  })
})