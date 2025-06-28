/**
 * Hooks de React Query para el módulo de Ambientes (Environments)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { environmentService } from '../services'
import type { 
  Environment, 
  EnvironmentCreate, 
  EnvironmentUpdate, 
  EnvironmentListParams 
} from '../types'

// Query Keys
export const environmentKeys = {
  all: ['environments'] as const,
  lists: () => [...environmentKeys.all, 'list'] as const,
  list: (params: EnvironmentListParams) => [...environmentKeys.lists(), params] as const,
  details: () => [...environmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...environmentKeys.details(), id] as const,
  stats: () => [...environmentKeys.all, 'stats'] as const,
  available: (campusId?: number) => [...environmentKeys.all, 'available', campusId] as const,
  checkCode: (code: string) => [...environmentKeys.all, 'check-code', code] as const,
}

/**
 * Hook para obtener lista de ambientes
 */
export function useEnvironments(params: EnvironmentListParams = {}) {
  return useQuery({
    queryKey: environmentKeys.list(params),
    queryFn: () => environmentService.getEnvironments(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  })
}

/**
 * Alias para compatibilidad con el formato de otros módulos
 */
export const useEnvironmentList = useEnvironments

/**
 * Hook para obtener un ambiente específico
 */
export function useEnvironment(id: number) {
  return useQuery({
    queryKey: environmentKeys.detail(id),
    queryFn: () => environmentService.getEnvironment(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para obtener estadísticas de ambientes
 */
export function useEnvironmentStats() {
  return useQuery({
    queryKey: environmentKeys.stats(),
    queryFn: () => environmentService.getEnvironmentStats(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  })
}

/**
 * Hook para obtener ambientes disponibles para programación
 */
export function useAvailableEnvironments(campusId?: number) {
  return useQuery({
    queryKey: environmentKeys.available(campusId),
    queryFn: () => environmentService.getAvailableEnvironments(campusId),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para verificar disponibilidad de código
 */
export function useCheckEnvironmentCode(code: string, excludeId?: number) {
  return useQuery({
    queryKey: environmentKeys.checkCode(`${code}-${excludeId || 'new'}`),
    queryFn: () => environmentService.isCodeAvailable(code, excludeId),
    enabled: !!code && code.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  })
}

/**
 * Hook para crear nuevo ambiente
 */
export function useCreateEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (environment: EnvironmentCreate) => 
      environmentService.createEnvironment(environment),
    onSuccess: (newEnvironment) => {
      // Invalidar listas de ambientes
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ 
        queryKey: environmentKeys.available(newEnvironment.campus_id) 
      })
      
      // Actualizar cache del detalle
      queryClient.setQueryData(
        environmentKeys.detail(newEnvironment.classroom_id),
        newEnvironment
      )

      // También invalidar stats de campus
      queryClient.invalidateQueries({ queryKey: ['campus', 'stats'] })

      toast.success('Ambiente creado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error creating environment:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al crear el ambiente. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para actualizar ambiente
 */
export function useUpdateEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, environment }: { id: number; environment: EnvironmentUpdate }) =>
      environmentService.updateEnvironment(id, environment),
    onSuccess: (updatedEnvironment) => {
      // Actualizar cache del detalle
      queryClient.setQueryData(
        environmentKeys.detail(updatedEnvironment.classroom_id),
        updatedEnvironment
      )

      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ 
        queryKey: environmentKeys.available(updatedEnvironment.campus_id) 
      })

      // También invalidar stats de campus
      queryClient.invalidateQueries({ queryKey: ['campus', 'stats'] })

      toast.success('Ambiente actualizado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error updating environment:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al actualizar el ambiente. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para eliminar ambiente
 */
export function useDeleteEnvironment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => environmentService.deleteEnvironment(id),
    onSuccess: (_, deletedId) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: environmentKeys.detail(deletedId) })
      
      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ 
        queryKey: environmentKeys.available() 
      })

      // También invalidar stats de campus
      queryClient.invalidateQueries({ queryKey: ['campus', 'stats'] })

      toast.success('Ambiente eliminado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error deleting environment:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al eliminar el ambiente. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para toggle del estado activo de un ambiente
 */
export function useToggleEnvironmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return environmentService.updateEnvironment(id, { active })
    },
    onMutate: async ({ id, active }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: environmentKeys.detail(id) })
      
      const previousEnvironment = queryClient.getQueryData<Environment>(
        environmentKeys.detail(id)
      )
      
      if (previousEnvironment) {
        queryClient.setQueryData<Environment>(environmentKeys.detail(id), {
          ...previousEnvironment,
          active,
          updated_at: new Date().toISOString()
        })
      }

      return { previousEnvironment }
    },
    onSuccess: (updatedEnvironment) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ 
        queryKey: environmentKeys.available(updatedEnvironment.campus_id) 
      })
      
      toast.success(
        `Ambiente ${updatedEnvironment.active ? 'activado' : 'desactivado'} exitosamente`
      )
    },
    onError: (error, { id }, context) => {
      // Revert optimistic update
      if (context?.previousEnvironment) {
        queryClient.setQueryData(
          environmentKeys.detail(id), 
          context.previousEnvironment
        )
      }
      
      console.error('Error toggling environment status:', error)
      toast.error('Error al cambiar el estado del ambiente')
    },
  })
}

/**
 * Hook para toggle de disponibilidad para programación
 */
export function useToggleEnvironmentScheduling() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, available }: { id: number; available: boolean }) => {
      return environmentService.updateEnvironment(id, { 
        available_for_scheduling: available 
      })
    },
    onMutate: async ({ id, available }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: environmentKeys.detail(id) })
      
      const previousEnvironment = queryClient.getQueryData<Environment>(
        environmentKeys.detail(id)
      )
      
      if (previousEnvironment) {
        queryClient.setQueryData<Environment>(environmentKeys.detail(id), {
          ...previousEnvironment,
          available_for_scheduling: available,
          updated_at: new Date().toISOString()
        })
      }

      return { previousEnvironment }
    },
    onSuccess: (updatedEnvironment) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ 
        queryKey: environmentKeys.available(updatedEnvironment.campus_id) 
      })
      
      toast.success(
        `Ambiente ${updatedEnvironment.available_for_scheduling ? 'habilitado' : 'deshabilitado'} para programación`
      )
    },
    onError: (error, { id }, context) => {
      // Revert optimistic update
      if (context?.previousEnvironment) {
        queryClient.setQueryData(
          environmentKeys.detail(id), 
          context.previousEnvironment
        )
      }
      
      console.error('Error toggling environment scheduling:', error)
      toast.error('Error al cambiar la disponibilidad del ambiente')
    },
  })
}

/**
 * Hook para eliminar múltiples ambientes
 */
export function useBulkDeleteEnvironments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => environmentService.deleteEnvironment(id)))
    },
    onSuccess: (_, deletedIds) => {
      // Remover del cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: environmentKeys.detail(id) })
      })
      
      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.stats() })
      queryClient.invalidateQueries({ queryKey: environmentKeys.available() })

      // También invalidar stats de campus
      queryClient.invalidateQueries({ queryKey: ['campus', 'stats'] })

      toast.success(`${deletedIds.length} ambientes eliminados exitosamente`)
    },
    onError: (error: any) => {
      console.error('Error bulk deleting environments:', error)
      toast.error('Error al eliminar los ambientes seleccionados')
    },
  })
}

/**
 * Hook para exportar datos de ambientes
 */
export function useExportEnvironments() {
  return useMutation({
    mutationFn: async ({ query, format }: { query: any; format: 'csv' | 'xlsx' }) => {
      // TODO: Implementar exportación real cuando el backend lo soporte
      console.log('Exporting environments:', { query, format })
      
      // Simulación temporal
      const data = await environmentService.getEnvironments(query)
      return data
    },
    onSuccess: () => {
      toast.success('Exportación iniciada')
    },
    onError: (error: any) => {
      console.error('Error exporting environments:', error)
      toast.error('Error al exportar los ambientes')
    },
  })
}