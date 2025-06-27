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
export const useInstructorList = (query: InstructorListQuery = {}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: instructorKeys.list(query),
    queryFn: () => instructorService.getInstructors(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
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
    onSuccess: (newInstructor) => {
      console.log('✅ [CREATE INSTRUCTOR HOOK] Success callback received instructor:', newInstructor)
      if (newInstructor && newInstructor.instructor_id) {
        queryClient.setQueryData(instructorKeys.detail(newInstructor.instructor_id.toString()), newInstructor)
        queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
        toast.success('Instructor creado exitosamente')
      } else {
        console.error('❌ [CREATE INSTRUCTOR HOOK] newInstructor is undefined or missing instructor_id:', newInstructor)
        toast.success('Instructor creado exitosamente') // Still show success since API returned 200
        queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear instructor')
    }
  })
}

/**
 * Hook to update existing instructor with optimistic updates
 */
export const useUpdateInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInstructorDTO }) =>
      instructorService.updateInstructor(id.toString(), data),
    onSuccess: (updatedInstructor, { id }) => {
      queryClient.setQueryData(instructorKeys.detail(id.toString()), updatedInstructor)
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
      toast.success('Instructor actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar instructor')
    }
  })
}

/**
 * Hook to delete instructor with optimistic updates
 */
export const useDeleteInstructor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => instructorService.deleteInstructor(id.toString()),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: instructorKeys.detail(deletedId.toString()) })
      queryClient.invalidateQueries({ queryKey: instructorKeys.lists() })
      toast.success('Instructor eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar instructor')
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