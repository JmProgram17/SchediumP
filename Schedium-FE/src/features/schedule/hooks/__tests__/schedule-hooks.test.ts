/**
 * Schedule Hooks Unit Tests
 * Comprehensive testing of schedule-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useScheduleList,
  useSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule
} from '../index'
import { scheduleService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  scheduleService: {
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

describe('Schedule Hooks', () => {
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

  describe('useScheduleList', () => {
    it('should fetch schedule list successfully', async () => {
      const mockSchedules = {
        data: [
          {
            id: 'schedule-1',
            courseId: 'course-1',
            instructorId: 'instructor-1',
            classroomId: 'classroom-1',
            dayOfWeek: 'MONDAY',
            startTime: '07:00',
            endTime: '09:00',
            startDate: '2024-02-01T00:00:00Z',
            endDate: '2024-12-31T00:00:00Z',
            group: 'Grupo A',
            capacity: 30,
            enrolled: 25,
            status: 'ACTIVE',
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

      vi.mocked(scheduleService.getList).mockResolvedValue(mockSchedules)

      const { result } = renderHook(() => useScheduleList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockSchedules)
      expect(scheduleService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(scheduleService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useScheduleList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass instructor filter correctly', async () => {
      const query = { instructorId: 'instructor-1', dayOfWeek: 'MONDAY' as const }
      vi.mocked(scheduleService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useScheduleList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(scheduleService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useSchedule', () => {
    const mockSchedule = {
      id: 'schedule-1',
      courseId: 'course-1',
      instructorId: 'instructor-1',
      classroomId: 'classroom-1',
      dayOfWeek: 'MONDAY' as const,
      startTime: '07:00',
      endTime: '09:00',
      startDate: '2024-02-01T00:00:00Z',
      endDate: '2024-12-31T00:00:00Z',
      group: 'Grupo A',
      capacity: 30,
      enrolled: 25,
      status: 'ACTIVE' as const,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single schedule successfully', async () => {
      vi.mocked(scheduleService.getById).mockResolvedValue(mockSchedule)

      const { result } = renderHook(() => useSchedule('schedule-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockSchedule)
      expect(scheduleService.getById).toHaveBeenCalledWith('schedule-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useSchedule(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(scheduleService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useSchedule('schedule-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(scheduleService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateSchedule', () => {
    it('should create schedule successfully', async () => {
      const newSchedule = {
        courseId: 'course-2',
        instructorId: 'instructor-2',
        classroomId: 'classroom-2',
        dayOfWeek: 'TUESDAY' as const,
        startTime: '09:00',
        endTime: '11:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo B',
        capacity: 25,
        enrolled: 0,
        status: 'ACTIVE' as const
      }

      const createdSchedule = {
        id: 'schedule-new',
        ...newSchedule,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(scheduleService.create).mockResolvedValue(createdSchedule)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateSchedule(), { wrapper })

      result.current.mutate(newSchedule)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(scheduleService.create).toHaveBeenCalledWith(newSchedule)
      expect(toast.success).toHaveBeenCalledWith('Horario creado exitosamente')
      expect(result.current.data).toEqual(createdSchedule)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Schedule conflict detected')
      vi.mocked(scheduleService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateSchedule(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Schedule conflict detected')
    })
  })

  describe('useUpdateSchedule', () => {
    it('should update schedule successfully', async () => {
      const updateData = {
        startTime: '08:00',
        endTime: '10:00',
        capacity: 35
      }

      const updatedSchedule = {
        id: 'schedule-1',
        courseId: 'course-1',
        instructorId: 'instructor-1',
        classroomId: 'classroom-1',
        dayOfWeek: 'MONDAY' as const,
        startTime: '08:00',
        endTime: '10:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo A',
        capacity: 35,
        enrolled: 25,
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(scheduleService.update).mockResolvedValue(updatedSchedule)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateSchedule(), { wrapper })

      result.current.mutate({ id: 'schedule-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(scheduleService.update).toHaveBeenCalledWith('schedule-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Horario actualizado exitosamente')
      expect(result.current.data).toEqual(updatedSchedule)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Time conflict with existing schedule')
      vi.mocked(scheduleService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateSchedule(), { wrapper })

      result.current.mutate({ id: 'schedule-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Time conflict with existing schedule')
    })
  })

  describe('useDeleteSchedule', () => {
    it('should delete schedule successfully', async () => {
      vi.mocked(scheduleService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteSchedule(), { wrapper })

      result.current.mutate('schedule-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(scheduleService.deleteItem).toHaveBeenCalledWith('schedule-1')
      expect(toast.success).toHaveBeenCalledWith('Horario eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete schedule with enrolled students')
      vi.mocked(scheduleService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteSchedule(), { wrapper })

      result.current.mutate('schedule-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Cannot delete schedule with enrolled students')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockSchedule = {
        id: 'schedule-new',
        courseId: 'course-2',
        instructorId: 'instructor-2',
        classroomId: 'classroom-2',
        dayOfWeek: 'TUESDAY' as const,
        startTime: '09:00',
        endTime: '11:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo B',
        capacity: 25,
        enrolled: 0,
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(scheduleService.create).mockResolvedValue(mockSchedule)
      vi.mocked(scheduleService.getList).mockResolvedValue({ 
        data: [mockSchedule], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateSchedule(), { wrapper })
      const { result: listResult } = renderHook(() => useScheduleList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new schedule
      createResult.current.mutate({
        courseId: 'course-2',
        instructorId: 'instructor-2',
        classroomId: 'classroom-2',
        dayOfWeek: 'TUESDAY',
        startTime: '09:00',
        endTime: '11:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo B',
        capacity: 25,
        enrolled: 0,
        status: 'ACTIVE'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(scheduleService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid time format', async () => {
      const timeError = new Error('Invalid time format')
      vi.mocked(scheduleService.create).mockRejectedValue(timeError)

      const { result } = renderHook(() => useCreateSchedule(), { wrapper })

      result.current.mutate({
        courseId: 'course-1',
        instructorId: 'instructor-1',
        classroomId: 'classroom-1',
        dayOfWeek: 'MONDAY',
        startTime: '25:00',
        endTime: '26:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo A',
        capacity: 30,
        enrolled: 0,
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(timeError)
    })

    it('should handle instructor conflict', async () => {
      const conflictError = new Error('Instructor has conflicting schedule')
      vi.mocked(scheduleService.create).mockRejectedValue(conflictError)

      const { result } = renderHook(() => useCreateSchedule(), { wrapper })

      result.current.mutate({
        courseId: 'course-1',
        instructorId: 'instructor-1',
        classroomId: 'classroom-2',
        dayOfWeek: 'MONDAY',
        startTime: '07:00',
        endTime: '09:00',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-12-31T00:00:00Z',
        group: 'Grupo C',
        capacity: 30,
        enrolled: 0,
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(conflictError)
    })

    it('should handle classroom conflict', async () => {
      const roomConflictError = new Error('Classroom is already occupied')
      vi.mocked(scheduleService.update).mockRejectedValue(roomConflictError)

      const { result } = renderHook(() => useUpdateSchedule(), { wrapper })

      result.current.mutate({ 
        id: 'schedule-1', 
        data: { classroomId: 'occupied-classroom' } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(roomConflictError)
    })

    it('should handle capacity validation', async () => {
      const capacityError = new Error('Capacity cannot be less than enrolled students')
      vi.mocked(scheduleService.update).mockRejectedValue(capacityError)

      const { result } = renderHook(() => useUpdateSchedule(), { wrapper })

      result.current.mutate({ 
        id: 'schedule-1', 
        data: { capacity: 10 } // Less than current enrolled (25)
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(capacityError)
    })
  })
})