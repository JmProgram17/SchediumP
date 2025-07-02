/**
 * NO CACHE HOOKS - Garantiza que NUNCA se use cache
 * Para datos que necesitan estar siempre sincronizados con la base de datos
 */

import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * Hook que garantiza NO CACHE - siempre consulta la base de datos
 */
export function useNoCacheQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean
    select?: (data: TData) => any
  }
) {
  const queryClient = useQueryClient()

  // Eliminar cualquier cache existente para esta query
  useEffect(() => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient, queryKey])

  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled ?? true,
    select: options?.select,
    // CONFIGURACIÓN ANTI-CACHE
    staleTime: 0,           // Siempre considerado obsoleto
    gcTime: 0,              // Eliminar inmediatamente del cache
    refetchOnMount: true,   // Siempre refetch al montar
    refetchOnWindowFocus: true,  // Refetch al enfocar ventana
    refetchOnReconnect: true,    // Refetch al reconectar
    retry: 1,              // Solo 1 reintento para ser más rápido
    
    // Configuración agresiva de red
    networkMode: 'online',
    
    // Callback para limpiar cache después de cada uso
    onSuccess: () => {
      // Programar limpieza del cache después de un pequeño delay
      setTimeout(() => {
        queryClient.removeQueries({ queryKey })
      }, 100)
    }
  })
}

/**
 * Hook que fuerza refetch inmediato después de mutaciones
 */
export function useForceRefreshAfterMutation() {
  const queryClient = useQueryClient()

  return {
    /**
     * Fuerza un refresh completo de todas las queries activas
     */
    forceRefreshAll: async () => {
      console.log('🔄 [NO CACHE] Force refreshing all active queries')
      
      // 1. Limpiar TODO el cache
      queryClient.clear()
      
      // 2. Invalidar todas las queries
      await queryClient.invalidateQueries()
      
      // 3. Refetch todas las queries activas
      await queryClient.refetchQueries({ type: 'active' })
      
      console.log('✅ [NO CACHE] Force refresh completed')
    },

    /**
     * Fuerza refresh de queries específicas
     */
    forceRefreshModule: async (module: string) => {
      console.log(`🔄 [NO CACHE] Force refreshing module: ${module}`)
      
      // 1. Limpiar cache del módulo
      queryClient.removeQueries({ queryKey: [module] })
      
      // 2. Invalidar queries del módulo
      await queryClient.invalidateQueries({ queryKey: [module] })
      
      // 3. Refetch queries del módulo
      await queryClient.refetchQueries({ queryKey: [module] })
      
      console.log(`✅ [NO CACHE] Module ${module} refresh completed`)
    },

    /**
     * Fuerza refresh de una query específica
     */
    forceRefreshQuery: async (queryKey: QueryKey) => {
      console.log('🔄 [NO CACHE] Force refreshing query:', queryKey)
      
      // 1. Limpiar cache de la query
      queryClient.removeQueries({ queryKey })
      
      // 2. Invalidar la query
      await queryClient.invalidateQueries({ queryKey })
      
      // 3. Refetch la query si está activa
      await queryClient.refetchQueries({ queryKey })
      
      console.log('✅ [NO CACHE] Query refresh completed')
    }
  }
}

/**
 * Hook que limpia cache automáticamente cuando el componente se desmonta
 */
export function useAutoCleanCache(queryKeys: QueryKey[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Cleanup al desmontar el componente
    return () => {
      console.log('🗑️ [NO CACHE] Auto-cleaning cache on unmount')
      queryKeys.forEach(queryKey => {
        queryClient.removeQueries({ queryKey })
      })
    }
  }, [queryClient, queryKeys])
}

/**
 * Hook que monitorea y limpia cache cada X segundos
 */
export function useCacheCleaner(intervalMs: number = 30000) {
  const queryClient = useQueryClient()

  useEffect(() => {
    console.log(`🧹 [NO CACHE] Starting cache cleaner (interval: ${intervalMs}ms)`)
    
    const interval = setInterval(() => {
      console.log('🧹 [NO CACHE] Cleaning cache...')
      
      // Limpiar cache de datos antiguos
      queryClient.clear()
      
      console.log('🧹 [NO CACHE] Cache cleaned')
    }, intervalMs)

    return () => {
      console.log('🧹 [NO CACHE] Stopping cache cleaner')
      clearInterval(interval)
    }
  }, [queryClient, intervalMs])
}