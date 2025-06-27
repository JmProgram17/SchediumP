/**
 * Customized QueryClient for Schedium with intelligent caching,
 * error handling, and performance optimizations
 */

import { QueryClient, QueryClientConfig, MutationCache, QueryCache } from '@tanstack/react-query'
import { ApiErrorHandler, EnhancedApiError, isAuthenticationError, isNetworkError } from '@/services/api'
import { authorizationService } from '@/services/auth/authorization.service'
import { tokenService } from '@/services/auth/token.service'
import { SECURITY_CONFIG } from '@/config'

/**
 * Cache configuration by module
 */
export const CACHE_CONFIG = {
  // Authentication data - short cache due to security
  AUTH: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    cacheTime: 10 * 60 * 1000,       // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1
  },

  // User data - medium cache
  USERS: {
    staleTime: 10 * 60 * 1000,       // 10 minutes
    cacheTime: 30 * 60 * 1000,       // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2
  },

  // Academic data - longer cache as it changes less frequently
  ACADEMIC: {
    staleTime: 15 * 60 * 1000,       // 15 minutes
    cacheTime: 60 * 60 * 1000,       // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3
  },

  // Static/reference data - very long cache
  REFERENCE: {
    staleTime: 60 * 60 * 1000,       // 1 hour
    cacheTime: 24 * 60 * 60 * 1000,  // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2
  },

  // Real-time data - minimal cache
  REALTIME: {
    staleTime: 30 * 1000,            // 30 seconds
    cacheTime: 2 * 60 * 1000,        // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
    refetchInterval: 60 * 1000       // Poll every minute
  }
} as const

/**
 * Query key factories for consistent key generation
 */
export const queryKeys = {
  // Authentication
  auth: {
    me: () => ['auth', 'me'] as const,
    permissions: () => ['auth', 'permissions'] as const,
    csrfToken: () => ['auth', 'csrf-token'] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  // Academic module
  academic: {
    all: () => ['academic'] as const,
    
    // Students
    students: {
      all: () => [...queryKeys.academic.all(), 'students'] as const,
      lists: () => [...queryKeys.academic.students.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.academic.students.lists(), { filters }] as const,
      details: () => [...queryKeys.academic.students.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.academic.students.details(), id] as const,
    },

    // Programs
    programs: {
      all: () => [...queryKeys.academic.all(), 'programs'] as const,
      lists: () => [...queryKeys.academic.programs.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.academic.programs.lists(), { filters }] as const,
      details: () => [...queryKeys.academic.programs.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.academic.programs.details(), id] as const,
    },

    // Courses
    courses: {
      all: () => [...queryKeys.academic.all(), 'courses'] as const,
      lists: () => [...queryKeys.academic.courses.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.academic.courses.lists(), { filters }] as const,
      details: () => [...queryKeys.academic.courses.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.academic.courses.details(), id] as const,
    },

    // Enrollments
    enrollments: {
      all: () => [...queryKeys.academic.all(), 'enrollments'] as const,
      lists: () => [...queryKeys.academic.enrollments.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.academic.enrollments.lists(), { filters }] as const,
      details: () => [...queryKeys.academic.enrollments.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.academic.enrollments.details(), id] as const,
      byStudent: (studentId: number) => [...queryKeys.academic.enrollments.all(), 'by-student', studentId] as const,
      byCourse: (courseId: number) => [...queryKeys.academic.enrollments.all(), 'by-course', courseId] as const,
    }
  },

  // HR module
  hr: {
    all: () => ['hr'] as const,
    
    instructors: {
      all: () => [...queryKeys.hr.all(), 'instructors'] as const,
      lists: () => [...queryKeys.hr.instructors.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.hr.instructors.lists(), { filters }] as const,
      details: () => [...queryKeys.hr.instructors.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.hr.instructors.details(), id] as const,
    }
  },

  // Infrastructure
  infrastructure: {
    all: () => ['infrastructure'] as const,
    
    classrooms: {
      all: () => [...queryKeys.infrastructure.all(), 'classrooms'] as const,
      lists: () => [...queryKeys.infrastructure.classrooms.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.infrastructure.classrooms.lists(), { filters }] as const,
      details: () => [...queryKeys.infrastructure.classrooms.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.infrastructure.classrooms.details(), id] as const,
      availability: (id: number, date: string) => [...queryKeys.infrastructure.classrooms.detail(id), 'availability', date] as const,
    }
  },

  // Scheduling
  scheduling: {
    all: () => ['scheduling'] as const,
    
    schedules: {
      all: () => [...queryKeys.scheduling.all(), 'schedules'] as const,
      lists: () => [...queryKeys.scheduling.schedules.all(), 'list'] as const,
      list: (filters?: Record<string, any>) => [...queryKeys.scheduling.schedules.lists(), { filters }] as const,
      details: () => [...queryKeys.scheduling.schedules.all(), 'detail'] as const,
      detail: (id: number) => [...queryKeys.scheduling.schedules.details(), id] as const,
      conflicts: () => [...queryKeys.scheduling.all(), 'conflicts'] as const,
      calendar: (startDate: string, endDate: string) => [...queryKeys.scheduling.all(), 'calendar', startDate, endDate] as const,
    }
  }
} as const

/**
 * Custom error handler for React Query
 */
const handleQueryError = (error: unknown): void => {
  const enhancedError = error as EnhancedApiError

  console.error('[QUERY ERROR]', {
    type: enhancedError.type,
    message: enhancedError.message,
    requestId: enhancedError.requestId,
    recovery: enhancedError.recovery
  })

  // Handle authentication errors globally
  if (isAuthenticationError(enhancedError)) {
    // Clear tokens and redirect to login
    tokenService.clearTokens()
    
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    return
  }

  // Handle network errors
  if (isNetworkError(enhancedError)) {
    // Could show a toast notification here
    console.warn('Network error detected, retries will be handled automatically')
    return
  }

  // For other errors, let components handle them
}

/**
 * Custom mutation error handler
 */
const handleMutationError = (error: unknown): void => {
  const enhancedError = error as EnhancedApiError

  console.error('[MUTATION ERROR]', {
    type: enhancedError.type,
    message: enhancedError.message,
    recovery: enhancedError.recovery
  })

  // Handle authentication errors
  if (isAuthenticationError(enhancedError)) {
    tokenService.clearTokens()
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }
}

/**
 * Custom retry function based on error type
 */
const customRetry = (failureCount: number, error: unknown): boolean => {
  const enhancedError = error as EnhancedApiError

  // Don't retry authentication or authorization errors
  if (isAuthenticationError(enhancedError) || enhancedError.type === 'AUTHORIZATION_ERROR') {
    return false
  }

  // Don't retry validation errors
  if (enhancedError.type === 'VALIDATION_ERROR') {
    return false
  }

  // Retry network errors and server errors up to 3 times
  if (isNetworkError(enhancedError) || enhancedError.type === 'SERVER_ERROR') {
    return failureCount < 3
  }

  // Retry rate limit errors once after delay
  if (enhancedError.type === 'RATE_LIMIT_ERROR') {
    return failureCount < 1
  }

  return false
}

/**
 * Default query configuration
 */
const defaultQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Default cache settings
      staleTime: CACHE_CONFIG.ACADEMIC.staleTime,
      cacheTime: CACHE_CONFIG.ACADEMIC.cacheTime,
      
      // Retry configuration
      retry: customRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: SECURITY_CONFIG.ENVIRONMENT.isDevelopment ? false : 'always',
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Network mode
      networkMode: 'online',
      
      // Error handling
      onError: handleQueryError,
      
      // Note: enabled should be handled per-query, not globally
      // This was causing queries to not refetch after invalidation
    },
    
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount, error) => {
        // Only retry network errors for mutations
        const enhancedError = error as EnhancedApiError
        
        // Don't retry CONFLICT or BUSINESS_ERROR (including program duplicates)
        if (enhancedError.type === 'BUSINESS_ERROR' || 
            enhancedError.type === 'VALIDATION_ERROR' ||
            enhancedError.error_code === 'CONFLICT' ||
            enhancedError.error_code === 'PROGRAM_ALREADY_EXISTS') {
          return false
        }
        
        return isNetworkError(enhancedError) && failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      // Error handling
      onError: handleMutationError,
      
      // Network mode
      networkMode: 'online',
    }
  },
  
  // Custom query cache
  queryCache: new QueryCache({
    onError: handleQueryError,
    onSuccess: (data, query) => {
      // Log successful queries in development
      if (SECURITY_CONFIG.ENVIRONMENT.isDevelopment) {
        console.log(`[QUERY SUCCESS] ${query.queryKey.join(' -> ')}`, {
          dataLength: Array.isArray(data) ? data.length : 'N/A',
          queryKey: query.queryKey
        })
      }
    }
  }),
  
  // Custom mutation cache
  mutationCache: new MutationCache({
    onError: handleMutationError,
    onSuccess: (data, variables, context, mutation) => {
      // Log successful mutations in development
      if (SECURITY_CONFIG.ENVIRONMENT.isDevelopment) {
        console.log(`[MUTATION SUCCESS] ${mutation.options.mutationKey?.join(' -> ') || 'unnamed'}`, {
          variables,
          data
        })
      }
    }
  })
}

/**
 * Create the customized QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient(defaultQueryConfig)
}

/**
 * Singleton QueryClient instance
 */
export const queryClient = createQueryClient()

/**
 * Cache utility functions
 */
export const cacheUtils = {
  /**
   * Invalidate all queries for a specific module
   */
  invalidateModule: async (module: 'auth' | 'users' | 'academic' | 'hr' | 'infrastructure' | 'scheduling') => {
    await queryClient.invalidateQueries({ queryKey: [module] })
  },

  /**
   * Invalidate specific resource queries
   */
  invalidateResource: async (module: string, resource: string) => {
    await queryClient.invalidateQueries({ queryKey: [module, resource] })
  },

  /**
   * Remove all data for a module
   */
  removeModuleData: (module: string) => {
    queryClient.removeQueries({ queryKey: [module] })
  },

  /**
   * Clear all cache data
   */
  clearAll: () => {
    queryClient.clear()
  },

  /**
   * Prefetch data for performance
   */
  prefetch: async <T>(queryKey: readonly unknown[], queryFn: () => Promise<T>, config?: { staleTime?: number }) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: config?.staleTime || CACHE_CONFIG.ACADEMIC.staleTime
    })
  },

  /**
   * Get cached data without triggering a fetch
   */
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  },

  /**
   * Set data in cache manually
   */
  setQueryData: <T>(queryKey: readonly unknown[], data: T | ((oldData: T | undefined) => T)) => {
    queryClient.setQueryData<T>(queryKey, data)
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      freshQueries: queries.filter(q => !q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'loading').length,
      cacheSize: new Blob([JSON.stringify(queries.map(q => q.state.data))]).size
    }
  }
}

/**
 * Cache invalidation strategies
 */
export const invalidationStrategies = {
  /**
   * Invalidate related queries when a student is created/updated/deleted
   */
  onStudentChange: async (studentId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.students.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.lists() }),
      studentId && queryClient.invalidateQueries({ queryKey: queryKeys.academic.students.detail(studentId) }),
      studentId && queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byStudent(studentId) })
    ])
  },

  /**
   * Invalidate related queries when a course is created/updated/deleted
   */
  onCourseChange: async (courseId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.courses.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.schedules.lists() }),
      courseId && queryClient.invalidateQueries({ queryKey: queryKeys.academic.courses.detail(courseId) }),
      courseId && queryClient.invalidateQueries({ queryKey: queryKeys.academic.enrollments.byCourse(courseId) })
    ])
  },

  /**
   * Invalidate related queries when an instructor is created/updated/deleted
   */
  onInstructorChange: async (instructorId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.hr.instructors.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.courses.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.schedules.lists() }),
      instructorId && queryClient.invalidateQueries({ queryKey: queryKeys.hr.instructors.detail(instructorId) })
    ])
  },

  /**
   * Invalidate related queries when a classroom is created/updated/deleted
   */
  onClassroomChange: async (classroomId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure.classrooms.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.schedules.lists() }),
      classroomId && queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure.classrooms.detail(classroomId) })
    ])
  },

  /**
   * Invalidate related queries when a schedule is created/updated/deleted
   */
  onScheduleChange: async (scheduleId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.schedules.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.conflicts() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure.classrooms.lists() }),
      scheduleId && queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.schedules.detail(scheduleId) })
    ])
  },

  /**
   * Invalidate all related data when user role changes
   */
  onUserRoleChange: async () => {
    // Clear all cache as permissions might have changed
    queryClient.clear()
  }
}