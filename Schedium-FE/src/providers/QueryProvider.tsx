/**
 * React Query Provider with Advanced Caching Strategy
 * Professional configuration for Schedium academic system
 */

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import toast from 'react-hot-toast'

/**
 * Advanced React Query configuration optimized for academic system
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long data is considered "fresh"
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time: How long data stays in cache when not in use
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        
        // Retry failed requests up to 3 times with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on authentication errors
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            return false
          }
          // Don't retry client errors (4xx)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus for critical data
        refetchOnWindowFocus: false,
        
        // Don't refetch on reconnect automatically
        refetchOnReconnect: 'always',
        
        // Background refetch interval (disabled by default)
        refetchInterval: false,
        
        // Error handling
        onError: (error: any) => {
          console.error('Query error:', error)
          
          // Show user-friendly error messages
          if (error?.response?.status >= 500) {
            toast.error('Error del servidor. Por favor, inténtalo de nuevo.')
          } else if (error?.response?.status === 404) {
            toast.error('Recurso no encontrado.')
          } else if (error?.message) {
            toast.error(error.message)
          }
        }
      },
      mutations: {
        // Retry mutations once for network errors
        retry: (failureCount, error: any) => {
          // Don't retry client errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          return failureCount < 1
        },
        
        // Global error handler for mutations
        onError: (error: any) => {
          console.error('Mutation error:', error)
          
          // Handle specific error cases
          if (error?.response?.status === 422) {
            toast.error('Datos inválidos. Revisa los campos.')
          } else if (error?.response?.status === 409) {
            toast.error('El recurso ya existe o hay un conflicto.')
          } else if (error?.response?.status >= 500) {
            toast.error('Error del servidor. Por favor, inténtalo de nuevo.')
          }
        }
      }
    }
  })
}

// Create global query client instance
export const queryClient = createQueryClient()

/**
 * Cache invalidation utilities for academic system
 */
export const cacheUtils = {
  /**
   * Invalidate all student-related queries
   */
  invalidateStudents: () => {
    queryClient.invalidateQueries({ queryKey: ['student'] })
  },
  
  /**
   * Invalidate all instructor-related queries
   */
  invalidateInstructors: () => {
    queryClient.invalidateQueries({ queryKey: ['instructor'] })
  },
  
  /**
   * Invalidate all program-related queries
   */
  invalidatePrograms: () => {
    queryClient.invalidateQueries({ queryKey: ['program'] })
  },
  
  /**
   * Invalidate all course-related queries
   */
  invalidateCourses: () => {
    queryClient.invalidateQueries({ queryKey: ['course'] })
  },
  
  /**
   * Invalidate all classroom-related queries
   */
  invalidateClassrooms: () => {
    queryClient.invalidateQueries({ queryKey: ['classroom'] })
  },
  
  /**
   * Invalidate all schedule-related queries
   */
  invalidateSchedules: () => {
    queryClient.invalidateQueries({ queryKey: ['schedule'] })
  },
  
  /**
   * Invalidate all enrollment-related queries
   */
  invalidateEnrollments: () => {
    queryClient.invalidateQueries({ queryKey: ['enrollment'] })
  },
  
  /**
   * Invalidate all academic data (nuclear option)
   */
  invalidateAllAcademicData: () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string
        return ['student', 'instructor', 'program', 'course', 'classroom', 'schedule', 'enrollment'].includes(key)
      }
    })
  },
  
  /**
   * Clear all cache (use with caution)
   */
  clearAllCache: () => {
    queryClient.clear()
  },
  
  /**
   * Prefetch critical data for dashboard
   */
  prefetchDashboardData: async () => {
    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: ['student', 'list', { page: 1, limit: 10 }],
        staleTime: 10 * 60 * 1000 // 10 minutes for dashboard data
      }),
      queryClient.prefetchQuery({
        queryKey: ['instructor', 'list', { page: 1, limit: 10 }],
        staleTime: 10 * 60 * 1000
      }),
      queryClient.prefetchQuery({
        queryKey: ['schedule', 'list', { page: 1, limit: 20 }],
        staleTime: 5 * 60 * 1000 // Schedules change more frequently
      })
    ]
    
    await Promise.allSettled(prefetchPromises)
  }
}

/**
 * Query performance monitoring
 */
export const queryMetrics = {
  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      freshQueries: queries.filter(q => !q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length
    }
  },
  
  /**
   * Log cache performance
   */
  logCachePerformance: () => {
    const stats = queryMetrics.getCacheStats()
    console.group('🚀 React Query Cache Performance')
    console.log('Total Queries:', stats.totalQueries)
    console.log('Active Queries:', stats.activeQueries)
    console.log('Stale Queries:', stats.staleQueries)
    console.log('Fresh Queries:', stats.freshQueries)
    console.log('Error Queries:', stats.errorQueries)
    console.groupEnd()
  }
}

interface QueryProviderProps {
  children: ReactNode
}

/**
 * React Query Provider Component
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook to access query client
 */
export { useQueryClient } from '@tanstack/react-query'