/**
 * Program Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { programService } from '../services'
import type {
  Program,
  CreateProgramDTO,
  UpdateProgramDTO,
  ProgramListQuery
} from '../types'

// Query keys for consistent cache management
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (query: ProgramListQuery) => [...programKeys.lists(), query] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
  exports: () => [...programKeys.all, 'export'] as const,
  bulk: () => [...programKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of programs
 */
export const useProgramList = (query: ProgramListQuery = {}) => {
  return useQuery({
    queryKey: programKeys.list(query),
    queryFn: () => programService.getPrograms(query),
    // NO CACHE: Always fetch fresh from database, no cache storage
    staleTime: 0,
    gcTime: 0,  // NO CACHE - remove immediately
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    meta: {
      errorMessage: 'Error al cargar la lista de programas académicos'
    }
  })
}

/**
 * Hook to fetch single program
 */
export const useProgram = (id: string, enabled = true) => {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programService.getProgram(id),
    enabled: enabled && !!id,
    // NO CACHE: Always fetch fresh from database, no cache storage
    staleTime: 0,
    gcTime: 0,  // NO CACHE - remove immediately
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    meta: {
      errorMessage: 'Error al cargar programa académico'
    }
  })
}

/**
 * Hook to create new program with optimistic updates
 */
export const useCreateProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProgramDTO) => programService.createProgram(data),
    onMutate: async (newProgram) => {
      await queryClient.cancelQueries({ queryKey: programKeys.lists() })

      const optimisticProgram: Program = {
        id: `temp-${Date.now()}`,
        ...newProgram,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const previousData = queryClient.getQueryData(programKeys.lists())
      
      queryClient.setQueriesData({ queryKey: programKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticProgram, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticProgram }
    },
    onSuccess: (newProgram, _, context) => {
      queryClient.setQueryData(programKeys.detail(newProgram.id), newProgram)
      
      queryClient.setQueriesData({ queryKey: programKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: Program) => 
            item.id === context?.optimisticProgram.id ? newProgram : item
          )
        }
      })
      
      toast.success('Programa académico creado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: programKeys.lists() }, context.previousData)
      }
      
      // Handle specific error codes
      const actualError = error?.error || error
      const errorData = actualError?.response?.data || actualError?.data || actualError
      const detail = errorData?.detail || errorData?.message || actualError?.message
      const errorCode = errorData?.error_code
      
      let errorMessage = 'Error al crear programa académico'
      if (errorCode === 'PROGRAM_ALREADY_EXISTS' || errorCode === 'CONFLICT') {
        errorMessage = 'Ya existe un programa con la misma combinación de nombre, nivel y cadena de formación. Modifica al menos uno de estos campos.'
      } else if (detail && detail.includes('mismo nombre') || detail.includes('misma combinación')) {
        errorMessage = 'Ya existe un programa con la misma combinación de nombre, nivel y cadena de formación. Modifica al menos uno de estos campos.'
      } else if (detail) {
        errorMessage = detail
      }
      
      toast.error(errorMessage)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    }
  })
}

/**
 * Hook to update existing program with optimistic updates
 */
export const useUpdateProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDTO }) =>
      programService.updateProgram(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: programKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: programKeys.lists() })

      const previousProgram = queryClient.getQueryData(programKeys.detail(id))
      const previousLists = queryClient.getQueryData(programKeys.lists())

      if (previousProgram) {
        const optimisticProgram = { ...previousProgram as Program, ...data, updatedAt: new Date().toISOString() }
        queryClient.setQueryData(programKeys.detail(id), optimisticProgram)
        
        queryClient.setQueriesData({ queryKey: programKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: Program) => 
              item.id === id ? optimisticProgram : item
            )
          }
        })
      }

      return { previousProgram, previousLists }
    },
    onSuccess: (updatedProgram) => {
      queryClient.setQueryData(programKeys.detail(updatedProgram.id), updatedProgram)
      toast.success('Programa académico actualizado exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousProgram) {
        queryClient.setQueryData(programKeys.detail(id), context.previousProgram)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: programKeys.lists() }, context.previousLists)
      }
      
      // Handle specific error codes
      const actualError = error?.error || error
      const errorData = actualError?.response?.data || actualError?.data || actualError
      const detail = errorData?.detail || errorData?.message || actualError?.message
      const errorCode = errorData?.error_code
      
      let errorMessage = 'Error al actualizar programa académico'
      if (errorCode === 'PROGRAM_ALREADY_EXISTS' || errorCode === 'CONFLICT') {
        errorMessage = 'Ya existe un programa con la misma combinación de nombre, nivel y cadena de formación. Modifica al menos uno de estos campos.'
      } else if (detail && detail.includes('mismo nombre') || detail.includes('misma combinación')) {
        errorMessage = 'Ya existe un programa con la misma combinación de nombre, nivel y cadena de formación. Modifica al menos uno de estos campos.'
      } else if (detail) {
        errorMessage = detail
      }
      
      toast.error(errorMessage)
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: programKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    }
  })
}

/**
 * Hook to delete program with optimistic updates
 */
export const useDeleteProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => programService.deleteProgram(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: programKeys.lists() })

      const previousData = queryClient.getQueryData(programKeys.lists())
      
      queryClient.setQueriesData({ queryKey: programKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: Program) => item.id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: programKeys.detail(deletedId) })
      toast.success('Programa académico eliminado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: programKeys.lists() }, context.previousData)
      }
      
      // Debug: log the full error structure
      console.error('Delete program error:', error)
      console.error('Error keys:', Object.keys(error || {}))
      console.error('Error.error:', error?.error)
      console.error('Error.error keys:', Object.keys(error?.error || {}))
      console.error('Error.error.response:', error?.error?.response)
      console.error('Error.error.response.data:', error?.error?.response?.data)
      console.error('Error.error.message:', error?.error?.message)
      console.error('Error.error.status:', error?.error?.status)
      
      // Handle specific error codes from backend
      let errorMessage = 'Error al eliminar programa académico'
      
      // Try to extract error information from different possible structures
      const actualError = error?.error || error
      const errorData = actualError?.response?.data || actualError?.data || actualError
      const detail = errorData?.detail || errorData?.message || actualError?.message
      const errorCode = errorData?.error_code
      
      console.log('Extracted error data:', errorData)
      console.log('Extracted detail:', detail)
      console.log('Extracted error code:', errorCode)
      
      // Check for specific error patterns
      if (errorCode === 'PROGRAM_HAS_GROUPS') {
        errorMessage = 'No se puede eliminar el programa porque tiene grupos de estudiantes asignados. Primero debe desactivar o transferir los grupos.'
      } else if (detail) {
        // Check if detail contains information about groups
        if (detail.includes('student groups') || detail.includes('grupos') || detail.includes('Cannot delete program')) {
          errorMessage = 'No se puede eliminar el programa porque tiene grupos de estudiantes asignados. Primero debe desactivar o transferir los grupos.'
        } else {
          errorMessage = detail
        }
      }
      
      console.log('Final error message:', errorMessage)
      
      toast.error(errorMessage)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkDeletePrograms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => programService.bulkDeletePrograms(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
      toast.success(`${result.deletedCount} programas eliminados exitosamente`)
    },
    onError: (error: any) => {
      let errorMessage = 'Error en eliminación masiva'
      if (error?.response?.data?.error_code === 'PROGRAM_HAS_GROUPS') {
        errorMessage = 'Algunos programas no se pueden eliminar porque tienen grupos de estudiantes asignados.'
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  })
}

export const useBulkUpdatePrograms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateProgramDTO }>) => 
      programService.bulkUpdatePrograms(updates),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
      queryClient.invalidateQueries({ queryKey: programKeys.details() })
      toast.success(`${result.updatedCount} programas actualizados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en actualización masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportPrograms = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: ProgramListQuery; format?: 'csv' | 'xlsx' }) =>
      programService.exportPrograms(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `programas_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Exportación completada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al exportar datos')
    }
  })
}