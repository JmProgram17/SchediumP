/**
 * Academic Configuration React Query Hooks
 * Custom hooks for academic configuration module using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, CACHE_CONFIG, invalidationStrategies } from '@/services/query/query-client'
import {
  quarterService,
  timeBlockService,
  dayConfigService,
  configurationService,
  transitionService
} from '../services'
import type {
  Quarter,
  TimeBlock,
  DayConfig,
  ConfigurationSettings,
  CreateQuarterRequest,
  UpdateQuarterRequest,
  CreateTimeBlockRequest,
  UpdateTimeBlockRequest,
  UpdateDayConfigRequest,
  UpdateConfigRequest,
  QuarterTransition,
  QuarterFilters,
  TimeBlockFilters
} from '../types'

// Extend query keys for academic config
const academicConfigKeys = {
  all: () => ['academic-config'] as const,
  
  quarters: {
    all: () => [...academicConfigKeys.all(), 'quarters'] as const,
    lists: () => [...academicConfigKeys.quarters.all(), 'list'] as const,
    list: (filters?: QuarterFilters) => [...academicConfigKeys.quarters.lists(), { filters }] as const,
    details: () => [...academicConfigKeys.quarters.all(), 'detail'] as const,
    detail: (id: number) => [...academicConfigKeys.quarters.details(), id] as const,
    active: () => [...academicConfigKeys.quarters.all(), 'active'] as const,
  },
  
  timeBlocks: {
    all: () => [...academicConfigKeys.all(), 'time-blocks'] as const,
    lists: () => [...academicConfigKeys.timeBlocks.all(), 'list'] as const,
    list: (filters?: TimeBlockFilters) => [...academicConfigKeys.timeBlocks.lists(), { filters }] as const,
    details: () => [...academicConfigKeys.timeBlocks.all(), 'detail'] as const,
    detail: (id: number) => [...academicConfigKeys.timeBlocks.details(), id] as const,
  },
  
  days: {
    all: () => [...academicConfigKeys.all(), 'days'] as const,
    list: () => [...academicConfigKeys.days.all(), 'list'] as const,
  },
  
  configuration: {
    all: () => [...academicConfigKeys.all(), 'configuration'] as const,
    settings: () => [...academicConfigKeys.configuration.all(), 'settings'] as const,
  },
}

// =============================================================================
// QUARTER HOOKS
// =============================================================================

/**
 * Get all quarters with optional filters
 */
export const useQuarters = (filters?: QuarterFilters) => {
  return useQuery({
    queryKey: academicConfigKeys.quarters.list(filters),
    queryFn: () => quarterService.getQuarters(filters),
    ...CACHE_CONFIG.ACADEMIC,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get active quarter
 */
export const useActiveQuarter = () => {
  return useQuery({
    queryKey: academicConfigKeys.quarters.active(),
    queryFn: () => quarterService.getActiveQuarter(),
    ...CACHE_CONFIG.ACADEMIC,
    staleTime: 2 * 60 * 1000, // 2 minutes - active quarter changes less frequently
  })
}

/**
 * Get quarter by ID
 */
export const useQuarter = (id: number) => {
  return useQuery({
    queryKey: academicConfigKeys.quarters.detail(id),
    queryFn: () => quarterService.getQuarter(id),
    ...CACHE_CONFIG.ACADEMIC,
    enabled: !!id,
  })
}

/**
 * Create quarter mutation
 */
export const useCreateQuarter = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateQuarterRequest) => quarterService.createQuarter(data),
    onSuccess: () => {
      // Invalidate quarter lists
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.lists() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.active() })
    },
  })
}

/**
 * Update quarter mutation
 */
export const useUpdateQuarter = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuarterRequest }) => 
      quarterService.updateQuarter(id, data),
    onSuccess: (updatedQuarter) => {
      // Update cache with new data
      queryClient.setQueryData(
        academicConfigKeys.quarters.detail(updatedQuarter.quarter_id),
        updatedQuarter
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.lists() })
      
      // If this quarter became active, invalidate active quarter query
      if (updatedQuarter.is_active) {
        queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.active() })
      }
    },
  })
}

/**
 * Delete quarter mutation
 */
export const useDeleteQuarter = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => quarterService.deleteQuarter(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: academicConfigKeys.quarters.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.lists() })
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.active() })
    },
  })
}

/**
 * Activate quarter mutation
 */
export const useActivateQuarter = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => quarterService.activateQuarter(id),
    onSuccess: (activatedQuarter) => {
      // Update cache
      queryClient.setQueryData(
        academicConfigKeys.quarters.detail(activatedQuarter.quarter_id),
        activatedQuarter
      )
      
      // Update active quarter cache
      queryClient.setQueryData(
        academicConfigKeys.quarters.active(),
        activatedQuarter
      )
      
      // Invalidate lists to update active status of other quarters
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.quarters.lists() })
      
      // Invalidate dashboard as active quarter affects metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
    },
  })
}

// =============================================================================
// TIME BLOCK HOOKS
// =============================================================================

/**
 * Get all time blocks with optional filters
 */
export const useTimeBlocks = (filters?: TimeBlockFilters) => {
  return useQuery({
    queryKey: academicConfigKeys.timeBlocks.list(filters),
    queryFn: () => timeBlockService.getTimeBlocks(filters),
    ...CACHE_CONFIG.REFERENCE, // Time blocks are reference data
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Get time block by ID
 */
export const useTimeBlock = (id: number) => {
  return useQuery({
    queryKey: academicConfigKeys.timeBlocks.detail(id),
    queryFn: () => timeBlockService.getTimeBlock(id),
    ...CACHE_CONFIG.REFERENCE,
    enabled: !!id,
  })
}

/**
 * Create time block mutation
 */
export const useCreateTimeBlock = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTimeBlockRequest) => timeBlockService.createTimeBlock(data),
    onSuccess: () => {
      // Invalidate time block lists
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks.lists() })
      
      // Invalidate dashboard as time blocks affect scheduling
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
    },
  })
}

/**
 * Update time block mutation
 */
export const useUpdateTimeBlock = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTimeBlockRequest }) => 
      timeBlockService.updateTimeBlock(id, data),
    onSuccess: (updatedTimeBlock) => {
      // Update cache
      queryClient.setQueryData(
        academicConfigKeys.timeBlocks.detail(updatedTimeBlock.time_block_id),
        updatedTimeBlock
      )
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks.lists() })
      
      // Invalidate dashboard and scheduling
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.all() })
    },
  })
}

/**
 * Delete time block mutation
 */
export const useDeleteTimeBlock = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => timeBlockService.deleteTimeBlock(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: academicConfigKeys.timeBlocks.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.timeBlocks.lists() })
      
      // Invalidate related modules
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.all() })
    },
  })
}

// =============================================================================
// DAY CONFIGURATION HOOKS
// =============================================================================

/**
 * Get all day configurations
 */
export const useDayConfigs = () => {
  return useQuery({
    queryKey: academicConfigKeys.days.list(),
    queryFn: () => dayConfigService.getDayConfigs(),
    ...CACHE_CONFIG.REFERENCE, // Days are reference data
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Update day configuration mutation
 */
export const useUpdateDayConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDayConfigRequest }) => 
      dayConfigService.updateDayConfig(id, data),
    onSuccess: () => {
      // Invalidate day configs
      queryClient.invalidateQueries({ queryKey: academicConfigKeys.days.list() })
      
      // Invalidate dashboard as days affect scheduling metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.all() })
    },
  })
}

// =============================================================================
// CONFIGURATION HOOKS
// =============================================================================

/**
 * Get all configuration settings
 */
export const useConfiguration = () => {
  return useQuery({
    queryKey: academicConfigKeys.configuration.settings(),
    queryFn: () => configurationService.getConfiguration(),
    ...CACHE_CONFIG.ACADEMIC,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Update configuration mutation
 */
export const useUpdateConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateConfigRequest[]) => configurationService.updateConfiguration(data),
    onSuccess: (updatedConfig) => {
      // Update cache with new configuration
      queryClient.setQueryData(
        academicConfigKeys.configuration.settings(),
        updatedConfig
      )
      
      // Invalidate all modules as configuration affects everything
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.all() })
    },
  })
}

/**
 * Reset configuration mutation
 */
export const useResetConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => configurationService.resetConfiguration(),
    onSuccess: (resetConfig) => {
      // Update cache with reset configuration
      queryClient.setQueryData(
        academicConfigKeys.configuration.settings(),
        resetConfig
      )
    },
  })
}

// =============================================================================
// TRANSITION HOOKS
// =============================================================================

/**
 * Preview quarter transition
 */
export const usePreviewTransition = () => {
  return useMutation({
    mutationFn: (data: QuarterTransition) => transitionService.previewTransition(data),
  })
}

/**
 * Execute quarter transition
 */
export const useExecuteTransition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: QuarterTransition) => transitionService.executeTransition(data),
    onSuccess: () => {
      // Invalidate everything as transition affects all data
      queryClient.clear()
    },
  })
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Invalidate academic config cache
 */
export const useInvalidateAcademicConfig = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: academicConfigKeys.all() })
  }
}

/**
 * Prefetch academic config data
 */
export const usePrefetchAcademicConfig = () => {
  const queryClient = useQueryClient()
  
  return () => {
    // Prefetch commonly used data
    queryClient.prefetchQuery({
      queryKey: academicConfigKeys.quarters.lists(),
      queryFn: () => quarterService.getQuarters(),
      staleTime: CACHE_CONFIG.ACADEMIC.staleTime
    })
    
    queryClient.prefetchQuery({
      queryKey: academicConfigKeys.quarters.active(),
      queryFn: () => quarterService.getActiveQuarter(),
      staleTime: CACHE_CONFIG.ACADEMIC.staleTime
    })
    
    queryClient.prefetchQuery({
      queryKey: academicConfigKeys.timeBlocks.lists(),
      queryFn: () => timeBlockService.getTimeBlocks(),
      staleTime: CACHE_CONFIG.REFERENCE.staleTime
    })
  }
}


