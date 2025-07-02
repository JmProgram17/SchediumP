/**
 * Custom hooks for guaranteed fresh data loading
 * Ensures all data is always fetched from database first
 */

import React, { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cacheUtils } from './query-client'

/**
 * Hook that forces fresh data loading when a component mounts
 * Use this in any component that needs guaranteed fresh data
 */
export function useFreshDataOnMount(modules?: string[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const loadFreshData = async () => {
      console.log('🚀 [FRESH DATA] Component mounted - Loading fresh data from database')
      
      try {
        if (modules && modules.length > 0) {
          // Invalidate specific modules
          console.log('📋 [FRESH DATA] Invalidating modules:', modules)
          for (const module of modules) {
            await queryClient.invalidateQueries({ queryKey: [module] })
            // Let staleTime: 0 configuration handle the refetch automatically
          }
        } else {
          // Invalidate ALL queries
          console.log('🌐 [FRESH DATA] Invalidating all queries')
          await queryClient.invalidateQueries()
        }
        
        console.log('✅ [FRESH DATA] Fresh data loading completed')
      } catch (error) {
        console.error('❌ [FRESH DATA] Fresh data loading failed:', error)
      }
    }

    loadFreshData()
  }, [queryClient]) // Include queryClient in dependencies

  return null
}

/**
 * Hook that forces fresh data loading when entering a route/module
 * Use this in route components to ensure fresh data on navigation
 */
export function useFreshDataOnRoute(moduleName: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const loadFreshModuleData = async () => {
      console.log(`🚀 [FRESH DATA] Entering ${moduleName} module - Loading fresh data`)
      
      try {
        // Clear any stale data for this module
        queryClient.removeQueries({ queryKey: [moduleName] })
        
        // Force fresh fetch for this module
        await queryClient.invalidateQueries({ queryKey: [moduleName] })
        // Let staleTime: 0 configuration handle the refetch automatically
        
        console.log(`✅ [FRESH DATA] ${moduleName} module fresh data loaded`)
      } catch (error) {
        console.error(`❌ [FRESH DATA] ${moduleName} module fresh data loading failed:`, error)
      }
    }

    loadFreshModuleData()
  }, [moduleName, queryClient])

  return null
}

/**
 * Hook that provides utilities for manual fresh data loading
 */
export function useFreshDataUtils() {
  const queryClient = useQueryClient()

  return {
    /**
     * Force refresh all data
     */
    refreshAll: async () => {
      console.log('🔄 [FRESH DATA] Manual refresh all data')
      await queryClient.invalidateQueries()
      await queryClient.refetchQueries({ type: 'active' })
    },

    /**
     * Force refresh specific module
     */
    refreshModule: async (module: string) => {
      console.log(`🔄 [FRESH DATA] Manual refresh module: ${module}`)
      await cacheUtils.invalidateModule(module as any)
    },

    /**
     * Force refresh specific resource
     */
    refreshResource: async (module: string, resource: string) => {
      console.log(`🔄 [FRESH DATA] Manual refresh resource: ${module}/${resource}`)
      await cacheUtils.invalidateResource(module, resource)
    },

    /**
     * Clear all cache and force fresh data on next query
     */
    clearAndRefresh: async () => {
      console.log('🗑️ [FRESH DATA] Clear all cache and refresh')
      queryClient.clear()
      await queryClient.refetchQueries({ type: 'active' })
    }
  }
}

/**
 * Hook that automatically refreshes data when the window gains focus
 * Ensures users always see the latest data when returning to the app
 */
export function useFreshDataOnFocus(enabled: boolean = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const handleWindowFocus = async () => {
      console.log('🔄 [FRESH DATA] Window focus detected - Refreshing all data')
      
      try {
        // Invalidate all queries and let staleTime: 0 handle refetch
        await queryClient.invalidateQueries()
        console.log('✅ [FRESH DATA] Window focus refresh completed')
      } catch (error) {
        console.error('❌ [FRESH DATA] Window focus refresh failed:', error)
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [enabled, queryClient])

  return null
}

/**
 * HOC that wraps a component with fresh data loading
 */
export function withFreshData<T extends {}>(
  Component: React.ComponentType<T>,
  modules?: string[]
) {
  return function WrappedComponent(props: T) {
    useFreshDataOnMount(modules)
    return React.createElement(Component, props)
  }
}