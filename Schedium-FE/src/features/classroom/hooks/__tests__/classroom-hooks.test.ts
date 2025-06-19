/**
 * Classroom Hooks Unit Tests
 * Comprehensive testing of classroom-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useClassroomList,
  useClassroom,
  useCreateClassroom,
  useUpdateClassroom,
  useDeleteClassroom
} from '../index'
import { classroomService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  classroomService: {
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

describe('Classroom Hooks', () => {
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

  describe('useClassroomList', () => {
    it('should fetch classroom list successfully', async () => {
      const mockClassrooms = {
        data: [
          {
            id: 'classroom-1',
            code: 'AUL-001',
            name: 'Aula 101',
            capacity: 30,
            building: 'Bloque A',
            floor: 1,
            equipment: ['Proyector', 'Computadores'],
            type: 'LABORATORIO',
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

      vi.mocked(classroomService.getList).mockResolvedValue(mockClassrooms)

      const { result } = renderHook(() => useClassroomList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockClassrooms)
      expect(classroomService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(classroomService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useClassroomList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass building filter correctly', async () => {
      const query = { building: 'Bloque A', type: 'LABORATORIO' as const }
      vi.mocked(classroomService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useClassroomList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useClassroom', () => {
    const mockClassroom = {
      id: 'classroom-1',
      code: 'AUL-001',
      name: 'Aula 101',
      capacity: 30,
      building: 'Bloque A',
      floor: 1,
      equipment: ['Proyector', 'Computadores'],
      type: 'LABORATORIO' as const,
      status: 'ACTIVE' as const,
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single classroom successfully', async () => {
      vi.mocked(classroomService.getById).mockResolvedValue(mockClassroom)

      const { result } = renderHook(() => useClassroom('classroom-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockClassroom)
      expect(classroomService.getById).toHaveBeenCalledWith('classroom-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useClassroom(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(classroomService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useClassroom('classroom-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(classroomService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateClassroom', () => {
    it('should create classroom successfully', async () => {
      const newClassroom = {
        code: 'AUL-002',
        name: 'Aula 102',
        capacity: 25,
        building: 'Bloque B',
        floor: 2,
        equipment: ['Pizarra Digital', 'Audio'],
        type: 'AULA_TEORICA' as const,
        status: 'ACTIVE' as const
      }

      const createdClassroom = {
        id: 'classroom-new',
        ...newClassroom,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(classroomService.create).mockResolvedValue(createdClassroom)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateClassroom(), { wrapper })

      result.current.mutate(newClassroom)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.create).toHaveBeenCalledWith(newClassroom)
      expect(toast.success).toHaveBeenCalledWith('Aula creado exitosamente')
      expect(result.current.data).toEqual(createdClassroom)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Classroom code already exists')
      vi.mocked(classroomService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateClassroom(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Classroom code already exists')
    })
  })

  describe('useUpdateClassroom', () => {
    it('should update classroom successfully', async () => {
      const updateData = {
        name: 'Aula 101 - Renovada',
        capacity: 35,
        equipment: ['Proyector', 'Computadores', 'Pizarra Digital']
      }

      const updatedClassroom = {
        id: 'classroom-1',
        code: 'AUL-001',
        name: 'Aula 101 - Renovada',
        capacity: 35,
        building: 'Bloque A',
        floor: 1,
        equipment: ['Proyector', 'Computadores', 'Pizarra Digital'],
        type: 'LABORATORIO' as const,
        status: 'ACTIVE' as const,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(classroomService.update).mockResolvedValue(updatedClassroom)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateClassroom(), { wrapper })

      result.current.mutate({ id: 'classroom-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.update).toHaveBeenCalledWith('classroom-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Aula actualizado exitosamente')
      expect(result.current.data).toEqual(updatedClassroom)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Invalid capacity')
      vi.mocked(classroomService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateClassroom(), { wrapper })

      result.current.mutate({ id: 'classroom-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid capacity')
    })
  })

  describe('useDeleteClassroom', () => {
    it('should delete classroom successfully', async () => {
      vi.mocked(classroomService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteClassroom(), { wrapper })

      result.current.mutate('classroom-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.deleteItem).toHaveBeenCalledWith('classroom-1')
      expect(toast.success).toHaveBeenCalledWith('Aula eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete classroom with active schedules')
      vi.mocked(classroomService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteClassroom(), { wrapper })

      result.current.mutate('classroom-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Cannot delete classroom with active schedules')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockClassroom = {
        id: 'classroom-new',
        code: 'AUL-002',
        name: 'Aula 102',
        capacity: 25,
        building: 'Bloque B',
        floor: 2,
        equipment: ['Pizarra Digital', 'Audio'],
        type: 'AULA_TEORICA' as const,
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(classroomService.create).mockResolvedValue(mockClassroom)
      vi.mocked(classroomService.getList).mockResolvedValue({ 
        data: [mockClassroom], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateClassroom(), { wrapper })
      const { result: listResult } = renderHook(() => useClassroomList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new classroom
      createResult.current.mutate({
        code: 'AUL-002',
        name: 'Aula 102',
        capacity: 25,
        building: 'Bloque B',
        floor: 2,
        equipment: ['Pizarra Digital', 'Audio'],
        type: 'AULA_TEORICA',
        status: 'ACTIVE'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(classroomService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid capacity validation', async () => {
      const validationError = new Error('Capacity must be between 5 and 100')
      vi.mocked(classroomService.create).mockRejectedValue(validationError)

      const { result } = renderHook(() => useCreateClassroom(), { wrapper })

      result.current.mutate({
        code: 'AUL-003',
        name: 'Test Classroom',
        capacity: 150,
        building: 'Test Building',
        floor: 1,
        equipment: [],
        type: 'AULA_TEORICA',
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(validationError)
    })

    it('should handle invalid classroom type', async () => {
      const typeError = new Error('Invalid classroom type')
      vi.mocked(classroomService.update).mockRejectedValue(typeError)

      const { result } = renderHook(() => useUpdateClassroom(), { wrapper })

      result.current.mutate({ 
        id: 'classroom-1', 
        data: { type: 'INVALID' as any } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(typeError)
    })

    it('should handle floor validation', async () => {
      const floorError = new Error('Floor must be between 1 and 10')
      vi.mocked(classroomService.create).mockRejectedValue(floorError)

      const { result } = renderHook(() => useCreateClassroom(), { wrapper })

      result.current.mutate({
        code: 'AUL-004',
        name: 'Test Classroom',
        capacity: 30,
        building: 'Test Building',
        floor: 15,
        equipment: [],
        type: 'AULA_TEORICA',
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(floorError)
    })
  })
})