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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      toast.error(error.message || 'Error al crear programa académico')
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
      toast.error(error.message || 'Error al actualizar programa académico')
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
      toast.error(error.message || 'Error al eliminar programa académico')
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
      toast.error(error.message || 'Error en eliminación masiva')
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