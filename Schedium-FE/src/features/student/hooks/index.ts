/**
 * Student Hooks - React Query integration with optimistic updates
 * Provides comprehensive CRUD operations with caching and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { studentService } from '../services'
// import { optimisticUpdate } from '@/utils/optimistic-updates'
import type {
  Student,
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentListQuery
} from '../types'

// Query keys for consistent cache management
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (query: StudentListQuery) => [...studentKeys.lists(), query] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  exports: () => [...studentKeys.all, 'export'] as const,
  bulk: () => [...studentKeys.all, 'bulk'] as const,
}

/**
 * Hook to fetch paginated list of students
 */
export const useStudentList = (query: StudentListQuery = {}) => {
  return useQuery({
    queryKey: studentKeys.list(query),
    queryFn: () => studentService.getStudents(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de estudiantes'
    }
  })
}

/**
 * Hook to fetch single student
 */
export const useStudent = (id: string, enabled = true) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getStudent(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar estudiante'
    }
  })
}

/**
 * Hook to create new student with optimistic updates
 */
export const useCreateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStudentDTO) => studentService.createStudent(data),
    onMutate: async (newStudent) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.lists() })

      const optimisticStudent: Student = {
        id: `temp-${Date.now()}`,
        ...newStudent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const previousData = queryClient.getQueryData(studentKeys.lists())
      
      queryClient.setQueriesData({ queryKey: studentKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: [optimisticStudent, ...old.items],
          total: old.total + 1
        }
      })

      return { previousData, optimisticStudent }
    },
    onSuccess: (newStudent, _, context) => {
      queryClient.setQueryData(studentKeys.detail(newStudent.id), newStudent)
      
      queryClient.setQueriesData({ queryKey: studentKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((item: Student) => 
            item.id === context?.optimisticStudent.id ? newStudent : item
          )
        }
      })
      
      toast.success('Estudiante creado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: studentKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al crear estudiante')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    }
  })
}

/**
 * Hook to update existing student with optimistic updates
 */
export const useUpdateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDTO }) =>
      studentService.updateStudent(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: studentKeys.lists() })

      const previousStudent = queryClient.getQueryData(studentKeys.detail(id))
      const previousLists = queryClient.getQueryData(studentKeys.lists())

      if (previousStudent) {
        const optimisticStudent = { ...previousStudent as Student, ...data, updatedAt: new Date().toISOString() }
        queryClient.setQueryData(studentKeys.detail(id), optimisticStudent)
        
        queryClient.setQueriesData({ queryKey: studentKeys.lists() }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: old.items.map((item: Student) => 
              item.id === id ? optimisticStudent : item
            )
          }
        })
      }

      return { previousStudent, previousLists }
    },
    onSuccess: (updatedStudent) => {
      queryClient.setQueryData(studentKeys.detail(updatedStudent.id), updatedStudent)
      toast.success('Estudiante actualizado exitosamente')
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(studentKeys.detail(id), context.previousStudent)
      }
      if (context?.previousLists) {
        queryClient.setQueriesData({ queryKey: studentKeys.lists() }, context.previousLists)
      }
      toast.error(error.message || 'Error al actualizar estudiante')
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    }
  })
}

/**
 * Hook to delete student with optimistic updates
 */
export const useDeleteStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.lists() })

      const previousData = queryClient.getQueryData(studentKeys.lists())
      
      queryClient.setQueriesData({ queryKey: studentKeys.lists() }, (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.filter((item: Student) => item.id !== id),
          total: Math.max(0, old.total - 1)
        }
      })

      return { previousData }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: studentKeys.detail(deletedId) })
      toast.success('Estudiante eliminado exitosamente')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: studentKeys.lists() }, context.previousData)
      }
      toast.error(error.message || 'Error al eliminar estudiante')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    }
  })
}

/**
 * Hook for bulk operations
 */
export const useBulkDeleteStudents = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => studentService.bulkDeleteStudents(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success(`${result.deletedCount} estudiantes eliminados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en eliminación masiva')
    }
  })
}

export const useBulkUpdateStudents = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateStudentDTO }>) => 
      studentService.bulkUpdateStudents(updates),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: studentKeys.details() })
      toast.success(`${result.updatedCount} estudiantes actualizados exitosamente`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error en actualización masiva')
    }
  })
}

/**
 * Hook for data export
 */
export const useExportStudents = () => {
  return useMutation({
    mutationFn: ({ query, format }: { query?: StudentListQuery; format?: 'csv' | 'xlsx' }) =>
      studentService.exportStudents(query, format),
    onSuccess: (blob, { format = 'csv' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `estudiantes_${new Date().toISOString().split('T')[0]}.${format}`
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
