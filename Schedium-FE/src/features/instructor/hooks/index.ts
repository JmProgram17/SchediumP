/**
 * Instructor Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { instructorService } from '../services'
import type {
  Instructor,
  CreateInstructorDTO,
  UpdateInstructorDTO,
  InstructorListQuery
} from '../types'

// Query keys for consistent cache management
export const instructorKeys = {
  all: ['instructors'] as const,
  lists: () => [...instructorKeys.all, 'list'] as const,
  list: (query: InstructorListQuery) => [...instructorKeys.lists(), query] as const,
  details: () => [...instructorKeys.all, 'detail'] as const,
  detail: (id: string) => [...instructorKeys.details(), id] as const,
  exports: () => [...instructorKeys.all, 'export'] as const,
  bulk: () => [...instructorKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of instructors
 */
export const useInstructorList = (query: InstructorListQuery = {}) => {
  return useQuery({
    queryKey: instructorKeys.list(query),
    queryFn: () => instructorService.getInstructors(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de instructores'
    }
  })
}

/**
 * Hook to fetch single instructor
 */
export const useInstructor = (id: string, enabled = true) => {
  return useQuery({
    queryKey: instructorKeys.detail(id),
    queryFn: () => instructorService.getInstructor(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar instructor'
    }
  })
}

/**
 * Hook to create new instructor with optimistic updates
 */
export const useCreateInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInstructorDTO) => instructorService.createInstructor(data),
    onMutate: async (newInstructor) => {
      await queryClient.cancelQueries({ queryKey: instructorKeys.lists() })

      const optimisticInstructor: Instructor = {
        id: `temp-${Date.now()}`,
        ...newInstructor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const previousData = queryClient.getQueryData(instructorKeys.lists())
      
      queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticInstructor, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticInstructor }
    },
    onSuccess: (newInstructor, _, context) => {
      queryClient.setQueryData(instructorKeys.detail(newInstructor.id), newInstructor)
      
      queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: Instructor) => 
            item.id === context?.optimisticInstructor.id ? newInstructor : item
          )
        }
      })
      
      toast.success('Instructor creado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al crear instructor')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
    }
  })
}

/**
 * Hook to update existing instructor with optimistic updates
 */
export const useUpdateInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstructorDTO }) =>
      instructorService.updateInstructor(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: instructorKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: instructorKeys.lists() })

      const previousInstructor = queryClient.getQueryData(instructorKeys.detail(id))
      const previousLists = queryClient.getQueryData(instructorKeys.lists())

      if (previousInstructor) {
        const optimisticInstructor = { ...previousInstructor as Instructor, ...data, updatedAt: new Date().toISOString() }
        queryClient.setQueryData(instructorKeys.detail(id), optimisticInstructor)
        
        queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: Instructor) => 
              item.id === id ? optimisticInstructor : item
            )
          }
        })
      }

      return { previousInstructor, previousLists }
    },
    onSuccess: (updatedInstructor) => {
      queryClient.setQueryData(instructorKeys.detail(updatedInstructor.id), updatedInstructor)
      toast.success('Instructor actualizado exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousInstructor) {
        queryClient.setQueryData(instructorKeys.detail(id), context.previousInstructor)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, context.previousLists)
      }
      toast.error(error.message || 'Error al actualizar instructor')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
    }
  })
}

/**
 * Hook to delete instructor with optimistic updates
 */
export const useDeleteInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => instructorService.deleteInstructor(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: instructorKeys.lists() })

      const previousData = queryClient.getQueryData(instructorKeys.lists())
      
      queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: Instructor) => item.id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: instructorKeys.detail(deletedId) })
      toast.success('Instructor eliminado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: instructorKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al eliminar instructor')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkDeleteInstructors = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => instructorService.bulkDeleteInstructors(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
      toast.success(`${result.deletedCount} instructores eliminados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en eliminación masiva')
    }
  })
}

export const useBulkUpdateInstructors = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateInstructorDTO }>) => 
      instructorService.bulkUpdateInstructors(updates),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
      queryClient.invalidateQueries({ queryKey: instructorKeys.details() })
      toast.success(`${result.updatedCount} instructores actualizados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en actualización masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportInstructors = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: InstructorListQuery; format?: 'csv' | 'xlsx' }) =>
      instructorService.exportInstructors(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `instructores_${new Date().toISOString().split('T')[0]}.${format}`
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