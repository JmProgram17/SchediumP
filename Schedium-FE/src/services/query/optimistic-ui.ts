/**
 * Optimistic UI system with automatic rollback for Schedium
 * Provides smooth user experience while handling failures gracefully
 */

import { useQueryClient, useMutation, MutationFunction } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { ApiError, isNetworkError, isValidationError } from '@/services/api'

/**
 * Optimistic update configuration
 */
export interface OptimisticConfig<TData, TVariables> {
  // Query key to update optimistically
  queryKey: readonly unknown[]
  
  // Function to update data optimistically
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
  
  // Optional condition to determine if optimistic update should be applied
  shouldUpdate?: (variables: TVariables) => boolean
  
  // Optional rollback delay (for better UX)
  rollbackDelay?: number
  
  // Custom error handler
  onError?: (error: unknown, variables: TVariables, context: any) => void
  
  // Success callback
  onSuccess?: (data: any, variables: TVariables, context: any) => void
}

/**
 * Optimistic list update types
 */
export type ListUpdateType = 'add' | 'update' | 'remove'

/**
 * Configuration for optimistic list updates
 */
export interface OptimisticListConfig<TItem, TVariables> {
  queryKey: readonly unknown[]
  updateType: ListUpdateType
  
  // For add operations
  createItem?: (variables: TVariables) => TItem
  
  // For update operations
  updateItem?: (oldItem: TItem, variables: TVariables) => TItem
  findItem?: (item: TItem, variables: TVariables) => boolean
  
  // For remove operations
  removeItem?: (item: TItem, variables: TVariables) => boolean
  
  // List extraction from paginated responses
  extractList?: (data: any) => TItem[]
  injectList?: (data: any, newList: TItem[]) => any
}

/**
 * Hook for optimistic mutations with automatic rollback
 */
export function useOptimisticMutation<TData, TError, TVariables, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  config: OptimisticConfig<TData, TVariables>
) {
  const queryClient = useQueryClient()
  const rollbackTimeoutRef = useRef<NodeJS.Timeout>()
  
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Clear any pending rollback
      if (rollbackTimeoutRef.current) {
        clearTimeout(rollbackTimeoutRef.current)
      }
      
      // Check if we should apply optimistic update
      if (config.shouldUpdate && !config.shouldUpdate(variables)) {
        return
      }
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey })
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(config.queryKey)
      
      // Optimistically update the data
      const optimisticData = config.updateFn(previousData, variables)
      queryClient.setQueryData(config.queryKey, optimisticData)
      
      // Return context with previous data for rollback
      return { previousData, variables }
    },
    onError: (error: TError, variables: TVariables, context: any) => {
      // Determine if we should rollback immediately or with delay
      const shouldRollbackImmediately = 
        isValidationError(error as any) || 
        (error as any)?.type === 'AUTHORIZATION_ERROR'
      
      const rollbackFn = () => {
        if (context?.previousData !== undefined) {
          queryClient.setQueryData(config.queryKey, context.previousData)
        } else {
          // If no previous data, invalidate to refetch
          queryClient.invalidateQueries({ queryKey: config.queryKey })
        }
      }
      
      if (shouldRollbackImmediately || !config.rollbackDelay) {
        rollbackFn()
      } else {
        // Delay rollback to avoid jarring UX for network errors
        rollbackTimeoutRef.current = setTimeout(rollbackFn, config.rollbackDelay)
      }
      
      // Call custom error handler
      config.onError?.(error, variables, context)
    },
    onSuccess: (data: TData, variables: TVariables, context: any) => {
      // Clear any pending rollback
      if (rollbackTimeoutRef.current) {
        clearTimeout(rollbackTimeoutRef.current)
      }
      
      // Update with actual server data
      queryClient.setQueryData(config.queryKey, data)
      
      // Call custom success handler
      config.onSuccess?.(data, variables, context)
    },
    onSettled: () => {
      // Ensure we clean up the timeout
      if (rollbackTimeoutRef.current) {
        clearTimeout(rollbackTimeoutRef.current)
      }
    }
  })
}

/**
 * Hook for optimistic list mutations (add, update, remove)
 */
export function useOptimisticListMutation<TItem, TError, TVariables, TContext = unknown>(
  mutationFn: MutationFunction<TItem, TVariables>,
  config: OptimisticListConfig<TItem, TVariables>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(config.queryKey)
      
      // Update based on operation type
      queryClient.setQueryData(config.queryKey, (oldData: any) => {
        if (!oldData) return oldData
        
        let list = config.extractList ? config.extractList(oldData) : oldData
        if (!Array.isArray(list)) return oldData
        
        let newList: TItem[]
        
        switch (config.updateType) {
          case 'add':
            if (!config.createItem) return oldData
            const newItem = config.createItem(variables)
            newList = [newItem, ...list]
            break
            
          case 'update':
            if (!config.updateItem || !config.findItem) return oldData
            newList = list.map(item => 
              config.findItem!(item, variables) 
                ? config.updateItem!(item, variables)
                : item
            )
            break
            
          case 'remove':
            if (!config.removeItem) return oldData
            newList = list.filter(item => !config.removeItem!(item, variables))
            break
            
          default:
            return oldData
        }
        
        return config.injectList ? config.injectList(oldData, newList) : newList
      })
      
      return { previousData }
    },
    onError: (error: TError, variables: TVariables, context: any) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(config.queryKey, context.previousData)
      }
    },
    onSuccess: (data: TItem, variables: TVariables) => {
      // For successful operations, we might want to update the item with server data
      if (config.updateType === 'add' || config.updateType === 'update') {
        queryClient.setQueryData(config.queryKey, (oldData: any) => {
          if (!oldData) return oldData
          
          let list = config.extractList ? config.extractList(oldData) : oldData
          if (!Array.isArray(list)) return oldData
          
          let newList: TItem[]
          
          if (config.updateType === 'add') {
            // Replace the optimistic item with the real one
            newList = list.map((item, index) => index === 0 ? data : item)
          } else {
            // Update with real server data
            newList = list.map(item =>
              config.findItem!(item, variables) ? data : item
            )
          }
          
          return config.injectList ? config.injectList(oldData, newList) : newList
        })
      }
    }
  })
}

/**
 * Utility functions for common optimistic updates
 */
export const optimisticHelpers = {
  /**
   * Create optimistic student
   */
  createOptimisticStudent: (variables: { first_name: string; last_name: string; email: string; document_number: string }) => ({
    id: Date.now(), // Temporary ID
    ...variables,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    program_id: undefined,
    // Mark as optimistic for UI feedback
    _optimistic: true
  }),
  
  /**
   * Update student optimistically
   */
  updateOptimisticStudent: (oldStudent: any, variables: { id: number; [key: string]: any }) => ({
    ...oldStudent,
    ...variables,
    updated_at: new Date().toISOString(),
    _optimistic: true
  }),
  
  /**
   * Create optimistic enrollment
   */
  createOptimisticEnrollment: (variables: { student_id: number; course_id: number }) => ({
    id: Date.now(),
    ...variables,
    enrollment_date: new Date().toISOString(),
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _optimistic: true
  }),
  
  /**
   * Extract list from paginated response
   */
  extractPaginatedList: <T>(data: { data: T[] } | T[]): T[] => {
    return Array.isArray(data) ? data : data?.data || []
  },
  
  /**
   * Inject list back into paginated response
   */
  injectPaginatedList: <T>(originalData: { data: T[]; pagination?: any; meta?: any }, newList: T[]) => ({
    ...originalData,
    data: newList
  }),
  
  /**
   * Find item by ID
   */
  findById: <T extends { id: number }>(id: number) => (item: T) => item.id === id,
  
  /**
   * Remove item by ID
   */
  removeById: <T extends { id: number }>(id: number) => (item: T) => item.id === id,
  
  /**
   * Add loading state to item
   */
  addLoadingState: <T extends { id: number }>(item: T): T & { _loading?: boolean } => ({
    ...item,
    _loading: true
  }),
  
  /**
   * Remove loading state from item
   */
  removeLoadingState: <T extends { id: number; _loading?: boolean }>(item: T): Omit<T, '_loading'> => {
    const { _loading, ...rest } = item
    return rest
  }
}

/**
 * Hook for batch optimistic updates
 */
export function useBatchOptimisticMutation<TData, TError, TVariables extends { id: number }[]>(
  mutationFn: MutationFunction<TData[], TVariables>,
  queryKey: readonly unknown[]
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey })
      
      const previousData = queryClient.getQueryData(queryKey)
      
      // Add loading state to all items being updated
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData
        
        const list = optimisticHelpers.extractPaginatedList(oldData)
        const newList = list.map((item: any) => 
          variables.some(v => v.id === item.id)
            ? optimisticHelpers.addLoadingState(item)
            : item
        )
        
        return optimisticHelpers.injectPaginatedList(oldData, newList)
      })
      
      return { previousData }
    },
    onError: (error: TError, variables: TVariables, context: any) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSuccess: (data: TData[], variables: TVariables) => {
      // Update with real server data
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData
        
        const list = optimisticHelpers.extractPaginatedList(oldData)
        const newList = list.map((item: any) => {
          const updatedItem = data.find((d: any) => d.id === item.id)
          return updatedItem ? { ...updatedItem, _loading: false } : optimisticHelpers.removeLoadingState(item)
        })
        
        return optimisticHelpers.injectPaginatedList(oldData, newList)
      })
    }
  })
}

/**
 * Hook for optimistic UI with visual feedback
 */
export function useOptimisticWithFeedback<TData, TError, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
  config: OptimisticConfig<TData, TVariables> & {
    showSuccessToast?: boolean
    showErrorToast?: boolean
    successMessage?: string | ((data: TData) => string)
    errorMessage?: string | ((error: TError) => string)
  }
) {
  const optimisticMutation = useOptimisticMutation(mutationFn, config)
  
  return {
    ...optimisticMutation,
    mutateWithFeedback: useCallback(async (variables: TVariables) => {
      try {
        const result = await optimisticMutation.mutateAsync(variables)
        
        if (config.showSuccessToast) {
          const message = typeof config.successMessage === 'function' 
            ? config.successMessage(result)
            : config.successMessage || 'Operation completed successfully'
          
          // Here you would integrate with your toast system
          console.log('SUCCESS:', message)
        }
        
        return result
      } catch (error) {
        if (config.showErrorToast) {
          const message = typeof config.errorMessage === 'function'
            ? config.errorMessage(error as TError)
            : config.errorMessage || 'Operation failed'
          
          // Here you would integrate with your toast system
          console.error('ERROR:', message)
        }
        
        throw error
      }
    }, [optimisticMutation, config])
  }
}