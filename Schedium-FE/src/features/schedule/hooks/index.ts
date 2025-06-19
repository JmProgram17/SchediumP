/**
 * Horario Hooks
 * Generated automatically by CRUD generator
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { scheduleService } from '../services'
import type {
  Schedule,
  CreateScheduleDTO,
  UpdateScheduleDTO,
  ScheduleListQuery
} from '../types'

// Query keys
export const scheduleKeys = {
  all: ['schedule'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (query: ScheduleListQuery) => [...scheduleKeys.lists(), query] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of Horarios
 */
export const useScheduleList = (query: ScheduleListQuery = {}) => {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: () => scheduleService.getList(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar la lista de horarios'
    }
  })
}

/**
 * Hook to fetch single Horario
 */
export const useSchedule = (id: string, enabled = true) => {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => scheduleService.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Error al cargar horario'
    }
  })
}

/**
 * Hook to create new Horario
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateScheduleDTO) => scheduleService.create(data),
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      queryClient.setQueryData(scheduleKeys.detail(newData.id), newData)
      toast.success('Horario creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear horario')
    }
  })
}

/**
 * Hook to update existing Horario
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleDTO }) =>
      scheduleService.update(id, data),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(scheduleKeys.detail(updatedData.id), updatedData)
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      toast.success('Horario actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar horario')
    }
  })
}

/**
 * Hook to delete Horario
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scheduleService.deleteItem(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      toast.success('Horario eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar horario')
    }
  })
}
