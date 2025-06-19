/**
 * Course Hooks Unit Tests
 * Comprehensive testing of course-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useCourseList,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse
} from '../index'
import { courseService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  courseService: {
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

describe('Course Hooks', () => {
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

  describe('useCourseList', () => {
    it('should fetch course list successfully', async () => {
      const mockCourses = {
        data: [
          {
            id: 'course-1',
            code: 'CRS-001',
            name: 'Fundamentos de Programación',
            description: 'Curso introductorio a la programación',
            credits: 3,
            hours: 60,
            semester: 1,
            programId: 'program-1',
            prerequisites: [],
            status: 'ACTIVE',
            createdAt: '2023-01-15T00:00:00Z',
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

      vi.mocked(courseService.getList).mockResolvedValue(mockCourses)

      const { result } = renderHook(() => useCourseList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCourses)
      expect(courseService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(courseService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCourseList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass program filter correctly', async () => {
      const query = { programId: 'program-1', semester: 1 }
      vi.mocked(courseService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useCourseList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(courseService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useCourse', () => {
    const mockCourse = {
      id: 'course-1',
      code: 'CRS-001',
      name: 'Fundamentos de Programación',
      description: 'Curso introductorio a la programación',
      credits: 3,
      hours: 60,
      semester: 1,
      programId: 'program-1',
      prerequisites: [] as string[],
      status: 'ACTIVE' as const,
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single course successfully', async () => {
      vi.mocked(courseService.getById).mockResolvedValue(mockCourse)

      const { result } = renderHook(() => useCourse('course-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCourse)
      expect(courseService.getById).toHaveBeenCalledWith('course-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useCourse(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(courseService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useCourse('course-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(courseService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateCourse', () => {
    it('should create course successfully', async () => {
      const newCourse = {
        code: 'CRS-002',
        name: 'Base de Datos',
        description: 'Curso de bases de datos relacionales',
        credits: 4,
        hours: 80,
        semester: 2,
        programId: 'program-1',
        prerequisites: ['course-1'],
        status: 'ACTIVE' as const
      }

      const createdCourse = {
        id: 'course-new',
        ...newCourse,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(courseService.create).mockResolvedValue(createdCourse)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateCourse(), { wrapper })

      result.current.mutate(newCourse)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(courseService.create).toHaveBeenCalledWith(newCourse)
      expect(toast.success).toHaveBeenCalledWith('Curso creado exitosamente')
      expect(result.current.data).toEqual(createdCourse)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Course code already exists')
      vi.mocked(courseService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateCourse(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Course code already exists')
    })
  })

  describe('useUpdateCourse', () => {
    it('should update course successfully', async () => {
      const updateData = {
        name: 'Fundamentos de Programación Avanzada',
        credits: 4,
        hours: 80
      }

      const updatedCourse = {
        id: 'course-1',
        code: 'CRS-001',
        name: 'Fundamentos de Programación Avanzada',
        description: 'Curso introductorio a la programación',
        credits: 4,
        hours: 80,
        semester: 1,
        programId: 'program-1',
        prerequisites: [] as string[],
        status: 'ACTIVE' as const,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(courseService.update).mockResolvedValue(updatedCourse)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateCourse(), { wrapper })

      result.current.mutate({ id: 'course-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(courseService.update).toHaveBeenCalledWith('course-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Curso actualizado exitosamente')
      expect(result.current.data).toEqual(updatedCourse)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Invalid prerequisite')
      vi.mocked(courseService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateCourse(), { wrapper })

      result.current.mutate({ id: 'course-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid prerequisite')
    })
  })

  describe('useDeleteCourse', () => {
    it('should delete course successfully', async () => {
      vi.mocked(courseService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteCourse(), { wrapper })

      result.current.mutate('course-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(courseService.deleteItem).toHaveBeenCalledWith('course-1')
      expect(toast.success).toHaveBeenCalledWith('Curso eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete course with active schedules')
      vi.mocked(courseService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteCourse(), { wrapper })

      result.current.mutate('course-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Cannot delete course with active schedules')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockCourse = {
        id: 'course-new',
        code: 'CRS-002',
        name: 'Base de Datos',
        description: 'Curso de bases de datos relacionales',
        credits: 4,
        hours: 80,
        semester: 2,
        programId: 'program-1',
        prerequisites: ['course-1'] as string[],
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(courseService.create).mockResolvedValue(mockCourse)
      vi.mocked(courseService.getList).mockResolvedValue({ 
        data: [mockCourse], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateCourse(), { wrapper })
      const { result: listResult } = renderHook(() => useCourseList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new course
      createResult.current.mutate({
        code: 'CRS-002',
        name: 'Base de Datos',
        description: 'Curso de bases de datos relacionales',
        credits: 4,
        hours: 80,
        semester: 2,
        programId: 'program-1',
        prerequisites: ['course-1'],
        status: 'ACTIVE'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(courseService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid credits validation', async () => {
      const validationError = new Error('Credits must be between 1 and 6')
      vi.mocked(courseService.create).mockRejectedValue(validationError)

      const { result } = renderHook(() => useCreateCourse(), { wrapper })

      result.current.mutate({
        code: 'CRS-003',
        name: 'Test Course',
        description: 'Test description',
        credits: 10,
        hours: 40,
        semester: 1,
        programId: 'program-1',
        prerequisites: [],
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(validationError)
    })

    it('should handle circular prerequisite error', async () => {
      const circularError = new Error('Circular prerequisite detected')
      vi.mocked(courseService.update).mockRejectedValue(circularError)

      const { result } = renderHook(() => useUpdateCourse(), { wrapper })

      result.current.mutate({ 
        id: 'course-1', 
        data: { prerequisites: ['course-1'] } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(circularError)
    })

    it('should handle semester validation', async () => {
      const semesterError = new Error('Semester must be between 1 and 10')
      vi.mocked(courseService.create).mockRejectedValue(semesterError)

      const { result } = renderHook(() => useCreateCourse(), { wrapper })

      result.current.mutate({
        code: 'CRS-004',
        name: 'Test Course',
        description: 'Test description',
        credits: 3,
        hours: 60,
        semester: 15,
        programId: 'program-1',
        prerequisites: [],
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(semesterError)
    })
  })
})