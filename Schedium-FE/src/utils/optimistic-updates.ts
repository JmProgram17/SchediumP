/**
 * Optimistic Updates Utilities
 * Professional utilities for implementing optimistic UI patterns
 */

import { QueryClient } from '@tanstack/react-query'
import { PaginatedResponse, BaseEntity } from '@/types'

/**
 * Generic optimistic update utilities
 */
export class OptimisticUpdates {
  constructor(private queryClient: QueryClient) {}

  /**
   * Optimistically add item to a list
   */
  addItemToList<T extends BaseEntity>(
    queryKey: readonly unknown[],
    newItem: T,
    options?: {
      position?: 'start' | 'end'
      maxItems?: number
    }
  ) {
    const { position = 'start', maxItems } = options || {}

    this.queryClient.setQueriesData<PaginatedResponse<T>>(
      { queryKey },
      (oldData) => {
        if (!oldData) return oldData

        const newItems = position === 'start' 
          ? [newItem, ...oldData.data]
          : [...oldData.data, newItem]

        // Limit items if specified
        const limitedItems = maxItems 
          ? newItems.slice(0, maxItems)
          : newItems

        return {
          ...oldData,
          data: limitedItems,
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1
          }
        }
      }
    )
  }

  /**
   * Optimistically update item in lists
   */
  updateItemInLists<T extends BaseEntity>(
    queryKey: readonly unknown[],
    updatedItem: T
  ) {
    // Update in list queries
    this.queryClient.setQueriesData<PaginatedResponse<T>>(
      { queryKey },
      (oldData) => {
        if (!oldData) return oldData

        const updatedItems = oldData.data.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        )

        return {
          ...oldData,
          data: updatedItems
        }
      }
    )

    // Update individual item cache
    const detailQueryKey = [...queryKey, 'detail', updatedItem.id]
    this.queryClient.setQueryData(detailQueryKey, updatedItem)
  }

  /**
   * Optimistically remove item from lists
   */
  removeItemFromLists<T extends BaseEntity>(
    queryKey: readonly unknown[],
    itemId: string
  ) {
    // Remove from list queries
    this.queryClient.setQueriesData<PaginatedResponse<T>>(
      { queryKey },
      (oldData) => {
        if (!oldData) return oldData

        const filteredItems = oldData.data.filter(item => item.id !== itemId)

        return {
          ...oldData,
          data: filteredItems,
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, oldData.pagination.total - 1)
          }
        }
      }
    )

    // Remove individual item cache
    const detailQueryKey = [...queryKey, 'detail', itemId]
    this.queryClient.removeQueries({ queryKey: detailQueryKey })
  }

  /**
   * Rollback optimistic update on error
   */
  rollbackUpdate(queryKey: readonly unknown[]) {
    this.queryClient.invalidateQueries({ queryKey })
  }

  /**
   * Smart update that handles both list and detail caches
   */
  smartUpdate<T extends BaseEntity>(
    baseQueryKey: readonly unknown[],
    item: T,
    operation: 'create' | 'update' | 'delete'
  ) {
    switch (operation) {
      case 'create':
        this.addItemToList([...baseQueryKey, 'list'], item)
        break
      case 'update':
        this.updateItemInLists([...baseQueryKey, 'list'], item)
        break
      case 'delete':
        this.removeItemFromLists([...baseQueryKey, 'list'], item.id)
        break
    }
  }
}

/**
 * Academic-specific optimistic update patterns
 */
export class AcademicOptimisticUpdates extends OptimisticUpdates {
  /**
   * Handle student enrollment optimistically
   */
  enrollStudent(
    studentId: string,
    scheduleId: string,
    enrollment: any
  ) {
    // Add enrollment to enrollments list
    this.addItemToList(['enrollment', 'list'], enrollment)

    // Update schedule enrolled count
    this.queryClient.setQueriesData(
      { queryKey: ['schedule'] },
      (oldData: any) => {
        if (!oldData) return oldData

        const updatedSchedules = oldData.data.map((schedule: any) =>
          schedule.id === scheduleId
            ? { ...schedule, enrolled: schedule.enrolled + 1 }
            : schedule
        )

        return {
          ...oldData,
          data: updatedSchedules
        }
      }
    )

    // Update individual schedule cache
    this.queryClient.setQueryData(
      ['schedule', 'detail', scheduleId],
      (oldSchedule: any) => {
        if (!oldSchedule) return oldSchedule
        return {
          ...oldSchedule,
          enrolled: oldSchedule.enrolled + 1
        }
      }
    )
  }

  /**
   * Handle schedule conflict detection
   */
  validateScheduleConflict(
    instructorId: string,
    classroomId: string,
    timeSlot: {
      dayOfWeek: string
      startTime: string
      endTime: string
    }
  ): boolean {
    // Check instructor conflicts
    const instructorSchedules = this.queryClient.getQueriesData({
      queryKey: ['schedule', 'list']
    })

    // Check classroom conflicts
    const classroomSchedules = this.queryClient.getQueriesData({
      queryKey: ['schedule', 'list']
    })

    // Implementation would check for actual conflicts
    // This is a simplified version
    return false
  }

  /**
   * Bulk operations for academic data
   */
  bulkUpdateGrades(
    enrollmentIds: string[],
    grades: Record<string, number>
  ) {
    enrollmentIds.forEach(id => {
      if (grades[id] !== undefined) {
        this.queryClient.setQueryData(
          ['enrollment', 'detail', id],
          (oldEnrollment: any) => {
            if (!oldEnrollment) return oldEnrollment
            return {
              ...oldEnrollment,
              grade: grades[id],
              updatedAt: new Date().toISOString()
            }
          }
        )
      }
    })

    // Invalidate list to refresh UI
    this.queryClient.invalidateQueries({
      queryKey: ['enrollment', 'list']
    })
  }
}

/**
 * Hook to get optimistic update utilities
 */
export const useOptimisticUpdates = () => {
  const queryClient = new QueryClient()
  return new OptimisticUpdates(queryClient)
}

/**
 * Hook to get academic optimistic update utilities
 */
export const useAcademicOptimisticUpdates = () => {
  const queryClient = new QueryClient()
  return new AcademicOptimisticUpdates(queryClient)
}