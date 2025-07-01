/**
 * Dashboard module React Query hooks for metrics and real-time data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { enhancedApiService } from '@/services/api'
import { queryKeys, CACHE_CONFIG } from '../query-client'
import { ApiResponse } from '@/types/api.types'

// Types for dashboard metrics
interface DashboardMetrics {
  ocupacion_general: {
    porcentaje: number
    aulas_ocupadas: number
    aulas_totales: number
    tendencia: 'positive' | 'negative' | 'neutral'
  }
  ambientes_activos: {
    total: number
    total_disponibles: number
    porcentaje_uso: number
    tendencia: 'positive' | 'negative' | 'neutral'
  }
  instructores_en_clase: {
    total: number
    total_instructores: number
    porcentaje_activo: number
    tendencia: 'positive' | 'negative' | 'neutral'
  }
  alertas_pendientes: {
    total: number
    detalle: {
      fichas_sin_instructor: number
      ambientes_sin_asignar: number
      instructores_sobrecargados: number
      conflictos_horarios: number
    }
    tendencia: 'positive' | 'negative' | 'neutral'
  }
}

interface OcupacionCampus {
  campus: string
  total_aulas: number
  aulas_ocupadas: number
  porcentaje_ocupacion: number
}

interface Dia {
  day_id: number
  name: string
  short_name: string
}

interface BloqueTime {
  time_block_id: number
  start_time: string
  end_time: string
  display_name: string
}

interface OcupacionSlot {
  day_id: number
  time_block_id: number
  ocupacion: number
  clases_programadas: number
  total_aulas: number
}

interface MapaCalorData {
  dias: Dia[]
  bloques_tiempo: BloqueTime[]
  ocupacion_matriz: OcupacionSlot[][]
}

interface ProximaHoraData {
  clases_inician: number
  clases_terminan: number
  aulas_se_liberan: number
  proxima_hora: string
}

interface DistribucionProgramasData {
  tipo: 'cadena' | 'nivel'
  distribucion: Array<{
    name: string
    value: number
    count: number
  }>
  total_grupos: number
  timestamp: string
}

// ===== DASHBOARD METRICS HOOKS =====

/**
 * Hook to get all dashboard metrics
 */
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await enhancedApiService.get<DashboardMetrics>('/dashboard/metrics', {
        context: { module: 'dashboard', operation: 'get_metrics' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 5 * 60 * 1000, // 5 minutes - reduced frequency
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
  })
}

/**
 * Hook to get ocupacion general metric
 */
export const useOcupacionGeneral = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.ocupacionGeneral(),
    queryFn: async (): Promise<DashboardMetrics['ocupacion_general']> => {
      const response = await enhancedApiService.get<DashboardMetrics['ocupacion_general']>('/dashboard/ocupacion-general', {
        context: { module: 'dashboard', operation: 'get_ocupacion_general' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 60 * 1000, // 1 minute
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to get ambientes activos metric
 */
export const useAmbientesActivos = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.ambientesActivos(),
    queryFn: async (): Promise<DashboardMetrics['ambientes_activos']> => {
      const response = await enhancedApiService.get<DashboardMetrics['ambientes_activos']>('/dashboard/ambientes-activos', {
        context: { module: 'dashboard', operation: 'get_ambientes_activos' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get instructores en clase metric
 */
export const useInstructoresEnClase = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.instructoresEnClase(),
    queryFn: async (): Promise<DashboardMetrics['instructores_en_clase']> => {
      const response = await enhancedApiService.get<DashboardMetrics['instructores_en_clase']>('/dashboard/instructores-activos', {
        context: { module: 'dashboard', operation: 'get_instructores_en_clase' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 60 * 1000, // 1 minute
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to get alertas pendientes metric
 */
export const useAlertasPendientes = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.alertasPendientes(),
    queryFn: async (): Promise<DashboardMetrics['alertas_pendientes']> => {
      const response = await enhancedApiService.get<DashboardMetrics['alertas_pendientes']>('/dashboard/alertas', {
        context: { module: 'dashboard', operation: 'get_alertas_pendientes' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 3 * 60 * 1000, // 3 minutes - alerts don't change as frequently
    staleTime: 90 * 1000, // 90 seconds
  })
}

/**
 * Hook to get ocupacion por campus for heatmap
 */
export const useOcupacionPorCampus = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.ocupacionCampus(),
    queryFn: async (): Promise<OcupacionCampus[]> => {
      const response = await enhancedApiService.get<OcupacionCampus[]>('/dashboard/ocupacion-campus', {
        context: { module: 'dashboard', operation: 'get_ocupacion_campus' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 10 * 60 * 1000, // 10 minutes - campus occupancy changes slowly
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  })
}

/**
 * Hook to get mapa de calor data (days, time blocks, and occupancy matrix)
 */
export const useMapaCalor = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.mapaCalor(),
    queryFn: async (): Promise<MapaCalorData> => {
      const response = await enhancedApiService.get<MapaCalorData>('/dashboard/mapa-calor', {
        context: { module: 'dashboard', operation: 'get_mapa_calor' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.ACADEMIC, // Use academic cache - schedule data is more static
    refetchInterval: 15 * 60 * 1000, // 15 minutes - schedule matrix changes infrequently
    staleTime: 10 * 60 * 1000, // 10 minutes stale time
  })
}

/**
 * Hook to get available days from database
 */
export const useDiasDisponibles = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.dias(),
    queryFn: async (): Promise<Dia[]> => {
      const response = await enhancedApiService.get<Dia[]>('/dashboard/dias', {
        context: { module: 'dashboard', operation: 'get_dias' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REFERENCE, // Days configuration changes rarely
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get time blocks from database
 */
export const useBloquesTime = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.bloquesTime(),
    queryFn: async (): Promise<BloqueTime[]> => {
      const response = await enhancedApiService.get<BloqueTime[]>('/dashboard/bloques-tiempo', {
        context: { module: 'dashboard', operation: 'get_bloques_tiempo' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REFERENCE, // Time blocks configuration changes rarely
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get next hour predictions
 */
export const useProximaHora = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.proximaHora(),
    queryFn: async (): Promise<ProximaHoraData> => {
      const response = await enhancedApiService.get<ProximaHoraData>('/dashboard/proxima-hora', {
        context: { module: 'dashboard', operation: 'get_proxima_hora' }
      })
      return response.data!
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 2 * 60 * 1000, // 2 minutes - predictions don't need to be super frequent
    staleTime: 60 * 1000, // 1 minute stale time
  })
}

/**
 * Hook to get program distribution data
 */
export const useDistribucionProgramas = (tipo: 'cadena' | 'nivel' = 'cadena') => {
  return useQuery({
    queryKey: queryKeys.dashboard.distribucionProgramas(tipo),
    queryFn: async (): Promise<DistribucionProgramasData> => {
      const response = await enhancedApiService.get<DistribucionProgramasData>(
        `/dashboard/distribucion-programas?tipo=${tipo}`, 
        {
          context: { module: 'dashboard', operation: 'get_distribucion_programas' }
        }
      )
      return response.data!
    },
    ...CACHE_CONFIG.ACADEMIC, // Program data changes less frequently
    refetchInterval: 30 * 60 * 1000, // 30 minutes - program distribution is very stable
    staleTime: 15 * 60 * 1000, // 15 minutes stale time
  })
}

// ===== UTILITY HOOKS =====

/**
 * Hook to prefetch dashboard metrics
 */
export const usePrefetchDashboardMetrics = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.metrics(),
      queryFn: async (): Promise<DashboardMetrics> => {
        const response = await enhancedApiService.get<DashboardMetrics>('/dashboard/metrics')
        return response.data!
      },
      staleTime: CACHE_CONFIG.REALTIME.staleTime
    })
  }
}

/**
 * Hook to manually refresh dashboard metrics
 */
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient()
  
  return () => {
    // Invalidate all dashboard queries to force refresh
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
  }
}

/**
 * Combined hook for all dashboard data (for dashboard page)
 */
export const useDashboardData = () => {
  const metrics = useDashboardMetrics()
  const ocupacionCampus = useOcupacionPorCampus()
  const mapaCalor = useMapaCalor()
  const proximaHora = useProximaHora()
  
  return {
    metrics,
    ocupacionCampus,
    mapaCalor,
    proximaHora,
    isLoading: metrics.isLoading || ocupacionCampus.isLoading || mapaCalor.isLoading || proximaHora.isLoading,
    isError: metrics.isError || ocupacionCampus.isError || mapaCalor.isError || proximaHora.isError,
    error: metrics.error || ocupacionCampus.error || mapaCalor.error || proximaHora.error,
    refetch: () => {
      metrics.refetch()
      ocupacionCampus.refetch()
      mapaCalor.refetch()
      proximaHora.refetch()
    }
  }
}