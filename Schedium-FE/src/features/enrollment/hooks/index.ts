/**
 * Matrícula Hooks
 * Generated automatically by CRUD generator
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { enrollmentService } from '../services'
import type {
  Enrollment,
  CreateEnrollmentDTO,
  UpdateEnrollmentDTO,
  EnrollmentListQuery
} from '../types'

// Query keys
export const enrollmentKeys = {
  all: ['enrollment'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (query: EnrollmentListQuery) => [...enrollmentKeys.lists(), query] as const,
  details: () => [...enrollmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...enrollmentKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of Matrículas
 */
export const useEnrollmentList = (query: EnrollmentListQuery = {}) => {
  return useQuery({
    queryKey: enrollmentKeys.list(query),
    queryFn: () => enrollmentService.getList(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de matrículas'
    }
  })
}

/**
 * Hook to fetch single Matrícula
 */
export const useEnrollment = (id: string, enabled = true) => {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => enrollmentService.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar matrícula'
    }
  })
}

/**
 * Hook to create new Matrícula
 */
export const useCreateEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEnrollmentDTO) => enrollmentService.create(data),
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      queryClient.setQueryData(enrollmentKeys.detail(newData.id), newData)
      toast.success('Matrícula creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear matrícula')
    }
  })
}

/**
 * Hook to update existing Matrícula
 */
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnrollmentDTO }) =>
      enrollmentService.update(id, data),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(enrollmentKeys.detail(updatedData.id), updatedData)
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      toast.success('Matrícula actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar matrícula')
    }
  })
}

/**
 * Hook to delete Matrícula
 */
export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => enrollmentService.deleteItem(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: enrollmentKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      toast.success('Matrícula eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar matrícula')
    }
  })
}
