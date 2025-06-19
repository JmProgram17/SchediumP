/**
 * Course Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { courseService } from '../services'
import type {
  Course,
  CreateCourseDTO,
  UpdateCourseDTO,
  CourseListQuery
} from '../types'

// Query keys for consistent cache management
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (query: CourseListQuery) => [...courseKeys.lists(), query] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  exports: () => [...courseKeys.all, 'export'] as const,
  bulk: () => [...courseKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of courses
 */
export const useCourseList = (query: CourseListQuery = {}) => {
  return useQuery({
    queryKey: courseKeys.list(query),
    queryFn: () => courseService.getCourses(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de cursos'
    }
  })
}

/**
 * Hook to fetch single course
 */
export const useCourse = (id: string, enabled = true) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar curso'
    }
  })
}

/**
 * Hook to create new course with optimistic updates
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCourseDTO) => courseService.createCourse(data),
    onMutate: async (newCourse) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() })

      const optimisticCourse: Course = {
        id: `temp-${Date.now()}`,
        ...newCourse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const previousData = queryClient.getQueryData(courseKeys.lists())
      
      queryClient.setQueriesData({ queryKey: courseKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticCourse, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticCourse }
    },
    onSuccess: (newCourse, _, context) => {
      queryClient.setQueryData(courseKeys.detail(newCourse.id), newCourse)
      
      queryClient.setQueriesData({ queryKey: courseKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: Course) => 
            item.id === context?.optimisticCourse.id ? newCourse : item
          )
        }
      })
      
      toast.success('Curso creado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: courseKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al crear curso')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    }
  })
}

/**
 * Hook to update existing course with optimistic updates
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseDTO }) =>
      courseService.updateCourse(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() })

      const previousCourse = queryClient.getQueryData(courseKeys.detail(id))
      const previousLists = queryClient.getQueryData(courseKeys.lists())

      if (previousCourse) {
        const optimisticCourse = { ...previousCourse as Course, ...data, updatedAt: new Date().toISOString() }
        queryClient.setQueryData(courseKeys.detail(id), optimisticCourse)
        
        queryClient.setQueriesData({ queryKey: courseKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: Course) => 
              item.id === id ? optimisticCourse : item
            )
          }
        })
      }

      return { previousCourse, previousLists }
    },
    onSuccess: (updatedCourse) => {
      queryClient.setQueryData(courseKeys.detail(updatedCourse.id), updatedCourse)
      toast.success('Curso actualizado exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(courseKeys.detail(id), context.previousCourse)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: courseKeys.lists() }, context.previousLists)
      }
      toast.error(error.message || 'Error al actualizar curso')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    }
  })
}

/**
 * Hook to delete course with optimistic updates
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() })

      const previousData = queryClient.getQueryData(courseKeys.lists())
      
      queryClient.setQueriesData({ queryKey: courseKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: Course) => item.id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: courseKeys.detail(deletedId) })
      toast.success('Curso eliminado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: courseKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al eliminar curso')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkDeleteCourses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => courseService.bulkDeleteCourses(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      toast.success(`${result.deletedCount} cursos eliminados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en eliminación masiva')
    }
  })
}

export const useBulkUpdateCourses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateCourseDTO }>) => 
      courseService.bulkUpdateCourses(updates),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.details() })
      toast.success(`${result.updatedCount} cursos actualizados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en actualización masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportCourses = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: CourseListQuery; format?: 'csv' | 'xlsx' }) =>
      courseService.exportCourses(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cursos_${new Date().toISOString().split('T')[0]}.${format}`
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