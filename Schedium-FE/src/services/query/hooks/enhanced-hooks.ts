/**
 * Enhanced hooks that integrate React Query with our Enhanced API Services
 * Provides optimistic UI, intelligent caching, and error handling
 */

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  useOptimisticListMutation, 
  useOptimisticMutation, 
  optimisticHelpers,
  useOptimisticWithFeedback 
} from '../optimistic-ui'
import { queryKeys, invalidationStrategies, CACHE_CONFIG } from '../query-client'
import { academicApi, authApi, hrApi, adminApi } from '@/services/api'
import { User } from '@/types/auth.types'

// ===== ENHANCED ACADEMIC HOOKS =====

/**
 * Enhanced hook for creating students with optimistic UI
 */
export const useCreateStudentOptimistic = () => {
  return useOptimisticListMutation(
    async (studentData: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await academicApi.submitForm('/students', studentData, {
        context: { module: 'academic', operation: 'create_student_optimistic' }
      })
      return response.data!
    },
    {
      queryKey: queryKeys.academic.students.lists(),
      updateType: 'add',
      createItem: optimisticHelpers.createOptimisticStudent,
      extractList: optimisticHelpers.extractPaginatedList,
      injectList: optimisticHelpers.injectPaginatedList
    }
  )
}

/**
 * Enhanced hook for updating students with optimistic UI and rollback
 */
export const useUpdateStudentOptimistic = () => {
  return useOptimisticWithFeedback(
    async ({ id, data }: { id: number; data: any }) => {
      const response = await academicApi.put(`/students/${id}`, data, {
        context: { module: 'academic', operation: 'update_student_optimistic' }
      })
      return response.data!
    },
    {
      queryKey: queryKeys.academic.students.detail(0), // Will be updated per call
      updateFn: (oldData, { id, data }) => oldData ? { ...oldData, ...data, updated_at: new Date().toISOString() } : oldData,
      rollbackDelay: 2000, // 2 second delay for better UX
      showSuccessToast: true,
      showErrorToast: true,
      successMessage: 'Student updated successfully',
      errorMessage: (error: any) => error.recovery?.userMessage || 'Failed to update student',
      onSuccess: (updatedStudent) => {
        invalidationStrategies.onStudentChange(updatedStudent.id)
      }
    }
  )
}

/**
 * Enhanced hook for batch updating student status
 */
export const useBatchUpdateStudentsStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'students', 'batch-update-status'],
    mutationFn: async ({ studentIds, status }: { studentIds: number[]; status: boolean }) => {
      const response = await academicApi.patch('/students/batch-status', { 
        student_ids: studentIds, 
        active: status 
      }, {
        context: { module: 'academic', operation: 'batch_update_students_status' }
      })
      return response.data!
    },
    onMutate: async ({ studentIds, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.academic.students.lists() })
      
      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.academic.students.lists() })
      
      // Optimistically update all student lists
      queryClient.setQueriesData({ queryKey: queryKeys.academic.students.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        
        const list = optimisticHelpers.extractPaginatedList(oldData)
        const newList = list.map((student: any) => 
          studentIds.includes(student.id)
            ? { ...student, active: status, _loading: true, updated_at: new Date().toISOString() }
            : student
        )
        
        return optimisticHelpers.injectPaginatedList(oldData, newList)
      })
      
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Restore all previous queries
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSuccess: (data, { studentIds }) => {
      // Remove loading states and update with real data
      queryClient.setQueriesData({ queryKey: queryKeys.academic.students.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        
        const list = optimisticHelpers.extractPaginatedList(oldData)
        const newList = list.map((student: any) => {
          const updatedStudent = data.find((s: any) => s.id === student.id)
          return updatedStudent ? { ...updatedStudent, _loading: false } : { ...student, _loading: false }
        })
        
        return optimisticHelpers.injectPaginatedList(oldData, newList)
      })
      
      // Invalidate individual student details
      studentIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: queryKeys.academic.students.detail(id) })
      })
    }
  })
}

// ===== ENHANCED ENROLLMENT HOOKS =====

/**
 * Enhanced hook for creating enrollments with conflict detection
 */
export const useCreateEnrollmentWithValidation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: ['academic', 'enrollments', 'create-with-validation'],
    mutationFn: async (enrollmentData: { student_id: number; course_id: number }) => {
      // First check for conflicts
      const conflictResponse = await academicApi.post('/enrollments/check-conflicts', enrollmentData, {
        context: { module: 'academic', operation: 'check_enrollment_conflicts' }
      })
      
      if (!conflictResponse.success) {
        throw new Error(conflictResponse.message)
      }
      
      // If no conflicts, create enrollment
      const response = await academicApi.post('/enrollments', enrollmentData, {
        context: { module: 'academic', operation: 'create_enrollment_validated' }
      })
      return response.data!
    },
    onMutate: async (variables) => {
      // Show loading state immediately
      const tempEnrollment = optimisticHelpers.createOptimisticEnrollment(variables)
      
      // Add to student's enrollments optimistically
      const studentEnrollmentsKey = queryKeys.academic.enrollments.byStudent(variables.student_id)
      await queryClient.cancelQueries({ queryKey: studentEnrollmentsKey })
      
      const previousStudentEnrollments = queryClient.getQueryData(studentEnrollmentsKey)
      queryClient.setQueryData(studentEnrollmentsKey, (old: any[]) => 
        old ? [tempEnrollment, ...old] : [tempEnrollment]
      )
      
      return { previousStudentEnrollments, tempEnrollment }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousStudentEnrollments !== undefined) {
        queryClient.setQueryData(
          queryKeys.academic.enrollments.byStudent(variables.student_id),
          context.previousStudentEnrollments
        )
      }
    },
    onSuccess: (realEnrollment, variables, context) => {
      // Replace optimistic enrollment with real one
      queryClient.setQueryData(
        queryKeys.academic.enrollments.byStudent(variables.student_id),
        (old: any[]) => old ? old.map(e => 
          e.id === context?.tempEnrollment.id ? realEnrollment : e
        ) : [realEnrollment]
      )
      
      // Invalidate related caches
      invalidationStrategies.onStudentChange(variables.student_id)
      invalidationStrategies.onCourseChange(variables.course_id)
    }
  })
}

// ===== ENHANCED SCHEDULING HOOKS =====

/**
 * Real-time schedule conflicts hook
 */
export const useScheduleConflicts = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.scheduling.conflicts(),
    queryFn: async () => {
      const response = await academicApi.get('/scheduling/conflicts', {
        params: { start_date: startDate, end_date: endDate },
        context: { module: 'scheduling', operation: 'get_conflicts' }
      })
      return response.data
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 30 * 1000, // Check for conflicts every 30 seconds
    enabled: !!(startDate && endDate)
  })
}

/**
 * Enhanced hook for updating schedules with conflict resolution
 */
export const useUpdateScheduleWithConflictResolution = () => {
  return useMutation({
    mutationKey: ['scheduling', 'update-with-conflict-resolution'],
    mutationFn: async ({ id, data, resolveConflicts }: { 
      id: number; 
      data: any; 
      resolveConflicts: boolean 
    }) => {
      const endpoint = resolveConflicts 
        ? `/scheduling/schedules/${id}/update-resolve-conflicts`
        : `/scheduling/schedules/${id}`
      
      const response = await academicApi.put(endpoint, data, {
        context: { module: 'scheduling', operation: 'update_schedule_with_conflicts' }
      })
      return response.data!
    },
    onSuccess: (data) => {
      invalidationStrategies.onScheduleChange(data.id)
    }
  })
}

// ===== ENHANCED USER MANAGEMENT HOOKS =====

/**
 * Enhanced hook for updating user profile with optimistic UI
 */
export const useUpdateUserProfileOptimistic = () => {
  const queryClient = useQueryClient()
  
  return useOptimisticMutation(
    async (profileData: Partial<User>) => {
      const response = await authApi.updateUser(profileData, undefined, {
        adapter: 'user',
        context: { module: 'auth', operation: 'update_profile_optimistic' }
      })
      return response.data!
    },
    {
      queryKey: queryKeys.auth.me(),
      updateFn: (oldUser, profileData) => oldUser ? { ...oldUser, ...profileData } : oldUser,
      rollbackDelay: 1500,
      onSuccess: (updatedUser) => {
        // Update auth store
        const { useAuthStore } = require('@/stores/auth.store')
        useAuthStore.getState().user = updatedUser
        
        // Clear any cached user data that might be stale
        queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      }
    }
  )
}

// ===== ENHANCED SEARCH HOOKS =====

/**
 * Debounced search hook with caching
 */
export const useSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  query: string,
  options: {
    debounceMs?: number
    minQueryLength?: number
    cacheKey: readonly unknown[]
  } = { debounceMs: 300, minQueryLength: 2, cacheKey: ['search'] }
) => {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query)
  
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query)
    }, options.debounceMs)
    
    return () => clearTimeout(timeout)
  }, [query, options.debounceMs])
  
  return useQuery({
    queryKey: [...options.cacheKey, debouncedQuery],
    queryFn: () => searchFn(debouncedQuery),
    enabled: debouncedQuery.length >= (options.minQueryLength || 2),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Global search hook across all modules
 */
export const useGlobalSearch = (query: string) => {
  return useSearch(
    async (searchQuery: string) => {
      const response = await academicApi.get('/search/global', {
        params: { q: searchQuery },
        context: { module: 'search', operation: 'global_search' }
      })
      return response.data || []
    },
    query,
    {
      cacheKey: ['search', 'global'],
      minQueryLength: 3,
      debounceMs: 500
    }
  )
}

// ===== ENHANCED ANALYTICS HOOKS =====

/**
 * Real-time dashboard metrics
 */
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await academicApi.get('/dashboard/metrics', {
        context: { module: 'dashboard', operation: 'get_metrics' }
      })
      return response.data
    },
    ...CACHE_CONFIG.REALTIME,
    refetchInterval: 60 * 1000, // Update every minute
    refetchIntervalInBackground: true
  })
}

// All hooks are already exported individually above