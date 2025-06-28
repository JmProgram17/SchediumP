/**
 * Hooks de React Query para el módulo de Sedes (Campus)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { campusService } from '../services'
import type { 
  Campus, 
  CampusCreate, 
  CampusUpdate, 
  CampusListParams 
} from '../types'

// Query Keys
export const campusKeys = {
  all: ['campus'] as const,
  lists: () => [...campusKeys.all, 'list'] as const,
  list: (params: CampusListParams) => [...campusKeys.lists(), params] as const,
  details: () => [...campusKeys.all, 'detail'] as const,
  detail: (id: number) => [...campusKeys.details(), id] as const,
  stats: () => [...campusKeys.all, 'stats'] as const,
  options: () => [...campusKeys.all, 'options'] as const,
}

/**
 * Hook para obtener lista de sedes
 */
export function useCampuses(params: CampusListParams = {}) {
  return useQuery({
    queryKey: campusKeys.list(params),
    queryFn: () => campusService.getCampuses(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  })
}

/**
 * Alias para compatibilidad con el formato de otros módulos
 */
export const useCampusList = useCampuses

/**
 * Hook para obtener una sede específica
 */
export function useCampus(id: number) {
  return useQuery({
    queryKey: campusKeys.detail(id),
    queryFn: () => campusService.getCampus(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para obtener estadísticas de sedes
 */
export function useCampusStats() {
  return useQuery({
    queryKey: campusKeys.stats(),
    queryFn: () => campusService.getCampusStats(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  })
}

/**
 * Hook para obtener opciones de sedes (para dropdowns)
 */
export function useCampusOptions() {
  return useQuery({
    queryKey: campusKeys.options(),
    queryFn: () => campusService.getCampusOptions(),
    staleTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  })
}

/**
 * Hook para crear nueva sede
 */
export function useCreateCampus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (campus: CampusCreate) => campusService.createCampus(campus),
    onSuccess: (newCampus) => {
      // Invalidar listas de sedes
      queryClient.invalidateQueries({ queryKey: campusKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campusKeys.stats() })
      queryClient.invalidateQueries({ queryKey: campusKeys.options() })
      
      // Actualizar cache del detalle
      queryClient.setQueryData(
        campusKeys.detail(newCampus.campus_id),
        newCampus
      )

      toast.success('Sede creada exitosamente')
    },
    onError: (error: any) => {
      console.error('Error creating campus:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al crear la sede. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para actualizar sede
 */
export function useUpdateCampus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, campus }: { id: number; campus: CampusUpdate }) =>
      campusService.updateCampus(id, campus),
    onSuccess: (updatedCampus) => {
      // Actualizar cache del detalle
      queryClient.setQueryData(
        campusKeys.detail(updatedCampus.campus_id),
        updatedCampus
      )

      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: campusKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campusKeys.stats() })
      queryClient.invalidateQueries({ queryKey: campusKeys.options() })

      toast.success('Sede actualizada exitosamente')
    },
    onError: (error: any) => {
      console.error('Error updating campus:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al actualizar la sede. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para eliminar sede
 */
export function useDeleteCampus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => campusService.deleteCampus(id),
    onSuccess: (_, deletedId) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: campusKeys.detail(deletedId) })
      
      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: campusKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campusKeys.stats() })
      queryClient.invalidateQueries({ queryKey: campusKeys.options() })

      toast.success('Sede eliminada exitosamente')
    },
    onError: (error: any) => {
      console.error('Error deleting campus:', error)
      toast.error(
        error.response?.data?.message || 
        'Error al eliminar la sede. Intenta nuevamente.'
      )
    },
  })
}

/**
 * Hook para verificar si una sede puede ser eliminada
 */
export function useCanDeleteCampus(id: number) {
  return useQuery({
    queryKey: [...campusKeys.detail(id), 'can-delete'],
    queryFn: () => campusService.canDeleteCampus(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para toggle del estado activo de una sede
 */
export function useToggleCampusStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return campusService.updateCampus(id, { active })
    },
    onMutate: async ({ id, active }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: campusKeys.detail(id) })
      
      const previousCampus = queryClient.getQueryData<Campus>(campusKeys.detail(id))
      
      if (previousCampus) {
        queryClient.setQueryData<Campus>(campusKeys.detail(id), {
          ...previousCampus,
          active,
          updated_at: new Date().toISOString()
        })
      }

      return { previousCampus }
    },
    onSuccess: (updatedCampus) => {
      queryClient.invalidateQueries({ queryKey: campusKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campusKeys.stats() })
      
      toast.success(
        `Sede ${updatedCampus.active ? 'activada' : 'desactivada'} exitosamente`
      )
    },
    onError: (error, { id }, context) => {
      // Revert optimistic update
      if (context?.previousCampus) {
        queryClient.setQueryData(campusKeys.detail(id), context.previousCampus)
      }
      
      console.error('Error toggling campus status:', error)
      toast.error('Error al cambiar el estado de la sede')
    },
  })
}

/**
 * Hook para eliminar múltiples sedes
 */
export function useBulkDeleteCampuses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => campusService.deleteCampus(id)))
    },
    onSuccess: (_, deletedIds) => {
      // Remover del cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: campusKeys.detail(id) })
      })
      
      // Invalidar listas y stats
      queryClient.invalidateQueries({ queryKey: campusKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campusKeys.stats() })
      queryClient.invalidateQueries({ queryKey: campusKeys.options() })

      toast.success(`${deletedIds.length} sedes eliminadas exitosamente`)
    },
    onError: (error: any) => {
      console.error('Error bulk deleting campuses:', error)
      toast.error('Error al eliminar las sedes seleccionadas')
    },
  })
}

/**
 * Hook para exportar datos de sedes
 */
export function useExportCampuses() {
  return useMutation({
    mutationFn: async ({ query, format }: { query: any; format: 'csv' | 'xlsx' }) => {
      // TODO: Implementar exportación real cuando el backend lo soporte
      console.log('Exporting campuses:', { query, format })
      
      // Simulación temporal
      const data = await campusService.getCampuses(query)
      return data
    },
    onSuccess: () => {
      toast.success('Exportación iniciada')
    },
    onError: (error: any) => {
      console.error('Error exporting campuses:', error)
      toast.error('Error al exportar las sedes')
    },
  })
}