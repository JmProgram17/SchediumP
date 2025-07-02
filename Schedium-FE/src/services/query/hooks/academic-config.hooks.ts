/**
 * Academic Configuration Query Hooks
 * React Query hooks for academic configuration API calls
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { academicConfigApi } from '@/services/api/academic-config.api'
import type {
  Quarter,
  QuarterCreate,
  QuarterUpdate,
  QuarterFilters,
  TimeBlock,
  TimeBlockCreate,
  TimeBlockUpdate,
  TimeBlockFilters,
  DayConfig,
  DayConfigUpdate
} from '@/services/api/academic-config.api'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const academicConfigKeys = {
  all: ['academic-config'] as const,
  quarters: () => [...academicConfigKeys.all, 'quarters'] as const,
  quarter: (id: number) => [...academicConfigKeys.quarters(), id] as const,
  activeQuarter: () => [...academicConfigKeys.quarters(), 'active'] as const,
  timeBlocks: () => [...academicConfigKeys.all, 'time-blocks'] as const,
  timeBlock: (id: number) => [...academicConfigKeys.timeBlocks(), id] as const,
  days: () => [...academicConfigKeys.all, 'days'] as const,
  day: (id: number) => [...academicConfigKeys.days(), id] as const,
  settings: () => [...academicConfigKeys.all, 'settings'] as const,
}

// ============================================================================
// QUARTER HOOKS
// ============================================================================

export function useQuarters(filters: QuarterFilters = {}) {
  return useQuery({
    queryKey: [...academicConfigKeys.quarters(), filters],
    queryFn: () => academicConfigApi.getQuarters(filters),
    select: (response) => response.data
  })
}

export function useActiveQuarter() {
  return useQuery({
    queryKey: academicConfigKeys.activeQuarter(),
    queryFn: academicConfigApi.getActiveQuarter,
    select: (response) => response.data
  })
}

export function useQuarter(quarterId: number) {
  return useQuery({
    queryKey: academicConfigKeys.quarter(quarterId),
    queryFn: () => academicConfigApi.getQuarter(quarterId),
    select: (response) => response.data,
    enabled: !!quarterId
  })
}

export function useCreateQuarter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quarterData: QuarterCreate) => academicConfigApi.createQuarter(quarterData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.activeQuarter() })
      // Invalidate scheduling queries since quarters affect programming
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      toast.success('Trimestre creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear el trimestre')
    }
  })
}

export function useUpdateQuarter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuarterUpdate }) => 
      academicConfigApi.updateQuarter(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarter(id) })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.activeQuarter() })
      // Invalidate scheduling queries since quarters affect programming
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      toast.success('Trimestre actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar el trimestre')
    }
  })
}

export function useDeleteQuarter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quarterId: number) => academicConfigApi.deleteQuarter(quarterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters() })
      toast.success('Trimestre eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar el trimestre')
    }
  })
}

export function useActivateQuarter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quarterId: number) => academicConfigApi.activateQuarter(quarterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.activeQuarter() })
      // Invalidate ALL scheduling queries when quarter changes
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      toast.success('Trimestre activado exitosamente - Sistema de programación actualizado')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al activar el trimestre')
    }
  })
}

// ============================================================================
// TIME BLOCK HOOKS
// ============================================================================

export function useTimeBlocks(filters: TimeBlockFilters = {}) {
  return useQuery({
    queryKey: [...academicConfigKeys.timeBlocks(), filters],
    queryFn: () => academicConfigApi.getTimeBlocks(filters),
    select: (response) => response.data
  })
}

export function useTimeBlock(timeBlockId: number) {
  return useQuery({
    queryKey: academicConfigKeys.timeBlock(timeBlockId),
    queryFn: () => academicConfigApi.getTimeBlock(timeBlockId),
    select: (response) => response.data,
    enabled: !!timeBlockId
  })
}

export function useCreateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeBlockData: TimeBlockCreate) => {
      console.log('🔧 DEBUG: Creating time block with data:', timeBlockData)
      return academicConfigApi.createTimeBlock(timeBlockData)
    },
    onSuccess: (response) => {
      console.log('✅ Time block created successfully:', response)
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks() })
      // Invalidate ALL scheduling queries that depend on time blocks
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      // No toast here - will be handled by parent component
    },
    onError: (error: any) => {
      console.error('🚨 Error creating time block:', error)
      console.error('🚨 Error response:', error?.response)
      console.error('🚨 Error data:', error?.response?.data)
      toast.error(error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear el bloque de tiempo')
    }
  })
}

export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TimeBlockUpdate }) => 
      academicConfigApi.updateTimeBlock(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlock(id) })
      // Invalidate ALL scheduling queries that depend on time blocks
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      // No toast here - will be handled by parent component
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar el bloque de tiempo')
    }
  })
}

export function useDeleteTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeBlockId: number) => academicConfigApi.deleteTimeBlock(timeBlockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks() })
      // Invalidate ALL scheduling queries that depend on time blocks
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      toast.success('Bloque de tiempo eliminado - Horarios afectados invalidados')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar el bloque de tiempo')
    }
  })
}

// ============================================================================
// DAY CONFIGURATION HOOKS
// ============================================================================

export function useDays() {
  return useQuery({
    queryKey: academicConfigKeys.days(),
    queryFn: academicConfigApi.getDays,
    select: (response) => response.data
  })
}

export function useUpdateDayConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DayConfigUpdate }) => 
      academicConfigApi.updateDayConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.days() })
      // Invalidate ALL scheduling queries that depend on days
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['days'] })
      // No toast here - will be handled by parent component
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar la configuración del día')
    }
  })
}

// ============================================================================
// CONFIGURATION HOOKS
// ============================================================================

export function useSettings() {
  return useQuery({
    queryKey: academicConfigKeys.settings(),
    queryFn: academicConfigApi.getSettings,
    select: (response) => response.data
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: any) => academicConfigApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.settings() })
      toast.success('Configuración actualizada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar la configuración')
    }
  })
}

export function useResetSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: academicConfigApi.resetSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.settings() })
      toast.success('Configuración restablecida a valores por defecto')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al restablecer la configuración')
    }
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useValidateQuarter() {
  return useMutation({
    mutationFn: (quarterData: QuarterCreate) => academicConfigApi.validateQuarter(quarterData),
    onError: (error: any) => {
      console.error('Validation error:', error)
    }
  })
}

// ============================================================================
// SCHEDULE CONFIGURATION HOOKS
// ============================================================================

export function useScheduleConfig() {
  return useQuery({
    queryKey: [...academicConfigKeys.all, 'schedule-config'],
    queryFn: academicConfigApi.getScheduleConfig,
    select: (response) => response.data
  })
}

export function useActiveScheduleConfig() {
  return useQuery({
    queryKey: [...academicConfigKeys.all, 'schedule-config', 'active'],
    queryFn: academicConfigApi.getActiveScheduleConfig,
    select: (response) => response.data
  })
}

export function useUpdateScheduleConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: academicConfigApi.updateScheduleConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...academicConfigKeys.all, 'schedule-config'] })
      // Invalidate ALL scheduling-related queries since schedule config affects everything
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['classSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['days'] })
      // No toast here - will be handled by parent component
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar la configuración de horarios')
    }
  })
}