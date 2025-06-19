/**
 * Program Hooks Unit Tests
 * Comprehensive testing of academic program-related React Query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'

import {
  useProgramList,
  useProgram,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram
} from '../index'
import { programService } from '../../services'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../services', () => ({
  programService: {
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

describe('Program Hooks', () => {
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

  describe('useProgramList', () => {
    it('should fetch program list successfully', async () => {
      const mockPrograms = {
        data: [
          {
            id: 'program-1',
            code: 'PRG-001',
            name: 'Técnico en Sistemas',
            description: 'Programa técnico en sistemas de información',
            duration: 4,
            modality: 'PRESENCIAL',
            level: 'TECNICO',
            department: 'Informática',
            status: 'ACTIVE',
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

      vi.mocked(programService.getList).mockResolvedValue(mockPrograms)

      const { result } = renderHook(() => useProgramList({ page: 1, limit: 10 }), {
        wrapper
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPrograms)
      expect(programService.getList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('should handle error state correctly', async () => {
      const mockError = new Error('Network error')
      vi.mocked(programService.getList).mockRejectedValue(mockError)

      const { result } = renderHook(() => useProgramList(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should pass level filter correctly', async () => {
      const query = { level: 'TECNICO' as const, department: 'Informática' }
      vi.mocked(programService.getList).mockResolvedValue({ data: [], pagination: {} as any })

      const { result } = renderHook(() => useProgramList(query), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(programService.getList).toHaveBeenCalledWith(query)
    })
  })

  describe('useProgram', () => {
    const mockProgram = {
      id: 'program-1',
      code: 'PRG-001',
      name: 'Técnico en Sistemas',
      description: 'Programa técnico en sistemas de información',
      duration: 4,
      modality: 'PRESENCIAL' as const,
      level: 'TECNICO' as const,
      department: 'Informática',
      status: 'ACTIVE' as const,
      createdAt: '2020-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }

    it('should fetch single program successfully', async () => {
      vi.mocked(programService.getById).mockResolvedValue(mockProgram)

      const { result } = renderHook(() => useProgram('program-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockProgram)
      expect(programService.getById).toHaveBeenCalledWith('program-1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useProgram(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(programService.getById).not.toHaveBeenCalled()
    })

    it('should respect enabled parameter', () => {
      const { result } = renderHook(() => useProgram('program-1', false), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
      expect(programService.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateProgram', () => {
    it('should create program successfully', async () => {
      const newProgram = {
        code: 'PRG-002',
        name: 'Tecnólogo en Análisis y Desarrollo de Software',
        description: 'Programa tecnólogo en desarrollo de software',
        duration: 6,
        modality: 'MIXTA' as const,
        level: 'TECNOLOGO' as const,
        department: 'Informática',
        status: 'ACTIVE' as const
      }

      const createdProgram = {
        id: 'program-new',
        ...newProgram,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(programService.create).mockResolvedValue(createdProgram)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateProgram(), { wrapper })

      result.current.mutate(newProgram)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(programService.create).toHaveBeenCalledWith(newProgram)
      expect(toast.success).toHaveBeenCalledWith('Programa Académico creado exitosamente')
      expect(result.current.data).toEqual(createdProgram)
    })

    it('should handle creation error', async () => {
      const mockError = new Error('Code already exists')
      vi.mocked(programService.create).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useCreateProgram(), { wrapper })

      result.current.mutate({} as any)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Code already exists')
    })
  })

  describe('useUpdateProgram', () => {
    it('should update program successfully', async () => {
      const updateData = {
        name: 'Técnico en Sistemas de Información',
        duration: 5
      }

      const updatedProgram = {
        id: 'program-1',
        code: 'PRG-001',
        name: 'Técnico en Sistemas de Información',
        description: 'Programa técnico en sistemas de información',
        duration: 5,
        modality: 'PRESENCIAL' as const,
        level: 'TECNICO' as const,
        department: 'Informática',
        status: 'ACTIVE' as const,
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }

      vi.mocked(programService.update).mockResolvedValue(updatedProgram)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateProgram(), { wrapper })

      result.current.mutate({ id: 'program-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(programService.update).toHaveBeenCalledWith('program-1', updateData)
      expect(toast.success).toHaveBeenCalledWith('Programa Académico actualizado exitosamente')
      expect(result.current.data).toEqual(updatedProgram)
    })

    it('should handle update error', async () => {
      const mockError = new Error('Update failed')
      vi.mocked(programService.update).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useUpdateProgram(), { wrapper })

      result.current.mutate({ id: 'program-1', data: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteProgram', () => {
    it('should delete program successfully', async () => {
      vi.mocked(programService.deleteItem).mockResolvedValue(undefined)
      vi.mocked(toast.success).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteProgram(), { wrapper })

      result.current.mutate('program-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(programService.deleteItem).toHaveBeenCalledWith('program-1')
      expect(toast.success).toHaveBeenCalledWith('Programa Académico eliminado exitosamente')
    })

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete program with active students')
      vi.mocked(programService.deleteItem).mockRejectedValue(mockError)
      vi.mocked(toast.error).mockImplementation(() => '')

      const { result } = renderHook(() => useDeleteProgram(), { wrapper })

      result.current.mutate('program-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(toast.error).toHaveBeenCalledWith('Cannot delete program with active students')
    })
  })

  describe('Hook integration', () => {
    it('should invalidate queries correctly after mutation', async () => {
      const mockProgram = {
        id: 'program-new',
        code: 'PRG-002',
        name: 'Tecnólogo en Análisis y Desarrollo de Software',
        description: 'Programa tecnólogo en desarrollo de software',
        duration: 6,
        modality: 'MIXTA' as const,
        level: 'TECNOLOGO' as const,
        department: 'Informática',
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }

      vi.mocked(programService.create).mockResolvedValue(mockProgram)
      vi.mocked(programService.getList).mockResolvedValue({ 
        data: [mockProgram], 
        pagination: {} as any 
      })

      const { result: createResult } = renderHook(() => useCreateProgram(), { wrapper })
      const { result: listResult } = renderHook(() => useProgramList(), { wrapper })

      // Wait for initial list fetch
      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true)
      })

      // Create new program
      createResult.current.mutate({
        code: 'PRG-002',
        name: 'Tecnólogo en Análisis y Desarrollo de Software',
        description: 'Programa tecnólogo en desarrollo de software',
        duration: 6,
        modality: 'MIXTA',
        level: 'TECNOLOGO',
        department: 'Informática',
        status: 'ACTIVE'
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // List should be refetched
      expect(programService.getList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle duration validation', async () => {
      const validationError = new Error('Duration must be between 1 and 8 semesters')
      vi.mocked(programService.create).mockRejectedValue(validationError)

      const { result } = renderHook(() => useCreateProgram(), { wrapper })

      result.current.mutate({
        code: 'PRG-003',
        name: 'Test Program',
        description: 'Test description',
        duration: 12,
        modality: 'PRESENCIAL',
        level: 'TECNICO',
        department: 'Test',
        status: 'ACTIVE'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(validationError)
    })

    it('should handle invalid modality', async () => {
      const modalityError = new Error('Invalid modality')
      vi.mocked(programService.update).mockRejectedValue(modalityError)

      const { result } = renderHook(() => useUpdateProgram(), { wrapper })

      result.current.mutate({ 
        id: 'program-1', 
        data: { modality: 'INVALID' as any } 
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(modalityError)
    })
  })
})