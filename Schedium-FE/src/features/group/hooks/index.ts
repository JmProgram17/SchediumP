/**
 * React Query hooks for Student Groups (Fichas)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { groupService } from '../services'
import type {
  StudentGroup,
  StudentGroupCreate,
  StudentGroupUpdate,
  StudentGroupQuery,
  StudentGroupExportQuery
} from '../types'

const QUERY_KEY = 'student-groups'

/**
 * Hook to fetch paginated student groups
 */
export const useGroupList = (query: StudentGroupQuery) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', query],
    queryFn: () => groupService.getGroups(query),
    keepPreviousData: true,
    staleTime: 0, // Siempre refrescar al invalidar
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

/**
 * Hook to fetch a single student group
 */
export const useGroup = (groupId: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', groupId],
    queryFn: () => groupId ? groupService.getGroup(groupId) : null,
    enabled: !!groupId,
  })
}

/**
 * Hook to create a new student group
 */
export const useCreateGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: StudentGroupCreate) => groupService.createGroup(data),
    onSuccess: (newGroup) => {
      // Invalidar solo las queries de la lista para refrescar
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'list'] })
      toast.success(`✅ Ficha ${newGroup.group_number} creada exitosamente`)
    },
    onError: (error: any) => {
      console.error('Create group error:', error)
      
      // Manejo específico de errores según el código de estado
      if (error.response?.status === 409) {
        // Error de conflicto - ficha duplicada
        const detail = error.response?.data?.detail || error.response?.data?.message
        if (detail?.toLowerCase().includes('group_number') || detail?.toLowerCase().includes('número')) {
          // Intentar extraer el número de ficha del request
          const groupNumber = error.config?.data ? JSON.parse(error.config.data).group_number : ''
          toast.error(`❌ Ya existe una ficha con el número ${groupNumber}`)
        } else {
          toast.error('❌ Ya existe una ficha con estos datos')
        }
      } else if (error.response?.status === 400) {
        // Error de validación
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
          // Si es un array de errores de validación de Pydantic
          const firstError = detail[0]
          const field = firstError.loc?.[1] || 'campo'
          const message = firstError.msg || 'valor inválido'
          toast.error(`❌ Error en ${field}: ${message}`)
        } else {
          toast.error(`❌ ${detail || 'Datos inválidos. Revise el formulario.'}`)
        }
      } else if (error.response?.status === 422) {
        // Error de entidad no procesable
        toast.error('❌ Los datos no cumplen con los requisitos')
      } else if (error.response?.status === 500) {
        // Error del servidor
        toast.error('❌ Error del servidor. Intente más tarde.')
      } else {
        // Error genérico
        toast.error(`❌ ${error.response?.data?.message || error.response?.data?.detail || 'Error al crear la ficha'}`)
      }
    },
  })
}

/**
 * Hook to update a student group
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: StudentGroupUpdate }) =>
      groupService.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      // Invalidar solo las queries relevantes para refrescar
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'list'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'detail', updatedGroup.group_id] })
      toast.success(`✅ Ficha ${updatedGroup.group_number} actualizada exitosamente`)
    },
    onError: (error: any) => {
      console.error('Update group error:', error)
      
      // Manejo específico de errores según el código de estado
      if (error.response?.status === 409) {
        // Error de conflicto
        const detail = error.response?.data?.detail || error.response?.data?.message
        if (detail?.includes('group_number')) {
          toast.error('❌ Ya existe otra ficha con ese número')
        } else {
          toast.error('❌ Ya existe una ficha con estos datos')
        }
      } else if (error.response?.status === 400) {
        // Error de validación
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
          const firstError = detail[0]
          const field = firstError.loc?.[1] || 'campo'
          const message = firstError.msg || 'valor inválido'
          toast.error(`❌ Error en ${field}: ${message}`)
        } else {
          toast.error(`❌ ${detail || 'Datos inválidos. Revise el formulario.'}`)
        }
      } else if (error.response?.status === 404) {
        toast.error('❌ La ficha no fue encontrada')
      } else if (error.response?.status === 500) {
        toast.error('❌ Error del servidor. Intente más tarde.')
      } else {
        toast.error(`❌ ${error.response?.data?.message || error.response?.data?.detail || 'Error al actualizar la ficha'}`)
      }
    },
  })
}

/**
 * Hook to delete a student group
 */
export const useDeleteGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupId: number) => groupService.deleteGroup(groupId),
    onSuccess: () => {
      // Invalidar todas las queries de la lista para refrescar
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'list'] })
      // También invalidar queries de programas por si afecta otros datos
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      toast.success('✅ Ficha eliminada correctamente')
    },
    onError: (error: any) => {
      console.error('Delete group error:', error)
      
      if (error.response?.status === 404) {
        toast.error('❌ La ficha no fue encontrada')
      } else if (error.response?.status === 409) {
        toast.error('❌ No se puede eliminar: tiene registros asociados')
      } else if (error.response?.status === 500) {
        toast.error('❌ Error del servidor. Intente más tarde.')
      } else {
        toast.error(`❌ ${error.response?.data?.message || error.response?.data?.detail || 'Error al eliminar la ficha'}`)
      }
    },
  })
}

/**
 * Hook to delete multiple student groups
 */
export const useBulkDeleteGroups = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupIds: number[]) => groupService.bulkDeleteGroups(groupIds),
    onSuccess: () => {
      // Invalidar todas las queries de la lista para refrescar
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'list'] })
      // También invalidar queries de programas por si afecta otros datos
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      toast.success('✅ Fichas eliminadas correctamente')
    },
    onError: (error: any) => {
      console.error('Bulk delete groups error:', error)
      
      if (error.response?.status === 409) {
        toast.error('❌ Algunas fichas no se pueden eliminar: tienen registros asociados')
      } else if (error.response?.status === 500) {
        toast.error('❌ Error del servidor. Intente más tarde.')
      } else {
        toast.error(`❌ ${error.response?.data?.message || error.response?.data?.detail || 'Error al eliminar las fichas'}`)
      }
    },
  })
}

/**
 * Hook to export student groups
 */
export const useExportGroups = () => {
  return useMutation({
    mutationFn: (query: StudentGroupExportQuery) => groupService.exportGroups(query),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const extension = variables.format === 'xlsx' ? 'xlsx' : 'csv'
      link.download = `fichas_${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('✅ Fichas exportadas exitosamente')
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.message || 'Error al exportar las fichas'}`)
    },
  })
}

/**
 * Hook to fetch all programs for dropdown
 */
export const useAllPrograms = () => {
  return useQuery({
    queryKey: ['programs', 'all'],
    queryFn: () => groupService.getAllPrograms(),
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Hook to fetch all schedules for dropdown
 */
export const useAllSchedules = () => {
  return useQuery({
    queryKey: ['schedules', 'all'],
    queryFn: () => groupService.getAllSchedules(),
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Hook to validate if a group number already exists
 */
export const useValidateGroupNumber = (groupNumber: number | null | undefined, excludeGroupId?: number) => {
  return useQuery({
    queryKey: ['validate-group-number', groupNumber, excludeGroupId],
    queryFn: () => groupNumber ? groupService.checkGroupNumberExists(groupNumber, excludeGroupId) : false,
    enabled: !!groupNumber && !isNaN(groupNumber) && groupNumber > 0,
    staleTime: 0, // Always fresh
    refetchOnWindowFocus: false,
  })
}