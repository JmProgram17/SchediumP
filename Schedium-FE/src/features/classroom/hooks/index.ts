/**
 * Classroom Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { classroomService } from '../services'
import type {
  Classroom,
  CreateClassroomDTO,
  UpdateClassroomDTO,
  ClassroomListQuery
} from '../types'

// Query keys for consistent cache management
export const classroomKeys = {
  all: ['classrooms'] as const,
  lists: () => [...classroomKeys.all, 'list'] as const,
  list: (query: ClassroomListQuery) => [...classroomKeys.lists(), query] as const,
  details: () => [...classroomKeys.all, 'detail'] as const,
  detail: (id: string) => [...classroomKeys.details(), id] as const,
  exports: () => [...classroomKeys.all, 'export'] as const,
  bulk: () => [...classroomKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of classrooms
 */
export const useClassroomList = (query: ClassroomListQuery = {}) => {
  return useQuery({
    queryKey: classroomKeys.list(query),
    queryFn: () => classroomService.getClassrooms(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de aulas'
    }
  })
}

/**
 * Hook to fetch single classroom
 */
export const useClassroom = (id: string, enabled = true) => {
  return useQuery({
    queryKey: classroomKeys.detail(id),
    queryFn: () => classroomService.getClassroom(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar aula'
    }
  })
}

/**
 * Hook to create new classroom with optimistic updates
 */
export const useCreateClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClassroomDTO) => classroomService.createClassroom(data),
    onMutate: async (newClassroom) => {
      await queryClient.cancelQueries({ queryKey: classroomKeys.lists() })

      const optimisticClassroom: Classroom = {
        id: `temp-${Date.now()}`,
        ...newClassroom,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const previousData = queryClient.getQueryData(classroomKeys.lists())
      
      queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticClassroom, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticClassroom }
    },
    onSuccess: (newClassroom, _, context) => {
      queryClient.setQueryData(classroomKeys.detail(newClassroom.id), newClassroom)
      
      queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: Classroom) => 
            item.id === context?.optimisticClassroom.id ? newClassroom : item
          )
        }
      })
      
      toast.success('Aula creada exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al crear aula')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() })
    }
  })
}

/**
 * Hook to update existing classroom with optimistic updates
 */
export const useUpdateClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassroomDTO }) =>
      classroomService.updateClassroom(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: classroomKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: classroomKeys.lists() })

      const previousClassroom = queryClient.getQueryData(classroomKeys.detail(id))
      const previousLists = queryClient.getQueryData(classroomKeys.lists())

      if (previousClassroom) {
        const optimisticClassroom = { ...previousClassroom as Classroom, ...data, updatedAt: new Date().toISOString() }
        queryClient.setQueryData(classroomKeys.detail(id), optimisticClassroom)
        
        queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: Classroom) => 
              item.id === id ? optimisticClassroom : item
            )
          }
        })
      }

      return { previousClassroom, previousLists }
    },
    onSuccess: (updatedClassroom) => {
      queryClient.setQueryData(classroomKeys.detail(updatedClassroom.id), updatedClassroom)
      toast.success('Aula actualizada exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousClassroom) {
        queryClient.setQueryData(classroomKeys.detail(id), context.previousClassroom)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, context.previousLists)
      }
      toast.error(error.message || 'Error al actualizar aula')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() })
    }
  })
}

/**
 * Hook to delete classroom with optimistic updates
 */
export const useDeleteClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => classroomService.deleteClassroom(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: classroomKeys.lists() })

      const previousData = queryClient.getQueryData(classroomKeys.lists())
      
      queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: Classroom) => item.id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: classroomKeys.detail(deletedId) })
      toast.success('Aula eliminada exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: classroomKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al eliminar aula')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() })
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkDeleteClassrooms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => classroomService.bulkDeleteClassrooms(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() })
      toast.success(`${result.deletedCount} aulas eliminadas exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en eliminación masiva')
    }
  })
}

export const useBulkUpdateClassrooms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateClassroomDTO }>) => 
      classroomService.bulkUpdateClassrooms(updates),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: classroomKeys.details() })
      toast.success(`${result.updatedCount} aulas actualizadas exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en actualización masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportClassrooms = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: ClassroomListQuery; format?: 'csv' | 'xlsx' }) =>
      classroomService.exportClassrooms(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `aulas_${new Date().toISOString().split('T')[0]}.${format}`
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
