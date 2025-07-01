/**
 * Academic Configuration Services
 * API services for academic configuration module
 */

import { enhancedApiService } from '@/services/api'
import { httpClient } from '@/services/api/http-client'
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
  TransitionSummary,
  QuartersResponse,
  TimeBlocksResponse,
  DaysResponse,
  ConfigurationResponse,
  QuarterFilters,
  TimeBlockFilters,
  QuarterValidation
} from '../types'

/**
 * Helper functions for data extraction
 */
function extractQuarterNumber(quarterName: string): number | null {
  // Extract quarter number from names like "Q1-2025", "Q2-2025", etc.
  const match = quarterName.match(/Q(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

function extractAcademicYear(quarterName: string): number | null {
  // Extract year from names like "Q1-2025", "Q2-2025", etc.
  const match = quarterName.match(/Q\d+-(\d{4})/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Quarter Management Services
 */
export const quarterService = {
  /**
   * Get all quarters with optional filters
   */
  async getQuarters(filters?: QuarterFilters): Promise<QuartersResponse> {
    const params = new URLSearchParams()
    
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString())
    }
    if (filters?.academic_year) {
      params.append('academic_year', filters.academic_year.toString())
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }
    
    const query = params.toString() ? `?${params.toString()}` : ''
    
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.get<{
      items: Quarter[]
      total: number
      page: number
      page_size: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }>(`/scheduling/quarters${query}`)
    
    console.log('🔍 Quarters Response:', JSON.stringify(response.data, null, 2))
    
    // Transform response to match expected format
    if (response.data && response.data.items) {
      // Add missing fields to quarters until backend properly returns them
      const quartersWithMissingFields = response.data.items.map(quarter => ({
        ...quarter,
        quarter_number: quarter.quarter_number || extractQuarterNumber(quarter.name),
        academic_year: quarter.academic_year || extractAcademicYear(quarter.name),
        description: quarter.description || null,
        is_active: quarter.is_active !== undefined ? quarter.is_active : (quarter.name === 'Q2-2025') // Q2-2025 should be active based on database
      }))
      
      console.log('🔧 Enhanced quarters with missing fields:', quartersWithMissingFields)
      
      return {
        quarters: quartersWithMissingFields,
        total: response.data.total,
        active_quarter: null, // Will be fetched separately
        page: response.data.page,
        limit: response.data.page_size,
        total_pages: response.data.total_pages
      }
    } else {
      console.error('❌ Invalid quarters response structure:', response.data)
      throw new Error('Invalid response structure from quarters API')
    }
  },

  /**
   * Get active quarter
   */
  async getActiveQuarter(): Promise<Quarter | null> {
    try {
      // Use httpClient directly for reliable endpoint access
      
      const response = await httpClient.get<Quarter | null>('/scheduling/quarters/current')
      
      console.log('🔍 Active Quarter Response:', JSON.stringify(response.data, null, 2))
      
      // Add missing fields to active quarter if needed
      if (response.data) {
        const enhancedQuarter = {
          ...response.data,
          quarter_number: response.data.quarter_number || extractQuarterNumber(response.data.name),
          academic_year: response.data.academic_year || extractAcademicYear(response.data.name),
          description: response.data.description || null,
          is_active: response.data.is_active !== undefined ? response.data.is_active : true // Active quarter should be active
        }
        
        console.log('🔧 Enhanced active quarter:', enhancedQuarter)
        return enhancedQuarter
      }
      
      return response.data
    } catch (error) {
      // Return null if no active quarter found
      return null
    }
  },

  /**
   * Get quarter by ID
   */
  async getQuarter(id: number): Promise<Quarter> {
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.get<Quarter>(`/scheduling/quarters/${id}`)
    
    return response.data
  },

  /**
   * Create new quarter
   */
  async createQuarter(data: CreateQuarterRequest): Promise<Quarter> {
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.post<Quarter>('/scheduling/quarters', data)
    
    return response.data
  },

  /**
   * Update quarter
   */
  async updateQuarter(id: number, data: UpdateQuarterRequest): Promise<Quarter> {
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.put<Quarter>(`/scheduling/quarters/${id}`, data)
    
    return response.data
  },

  /**
   * Delete quarter
   */
  async deleteQuarter(id: number): Promise<void> {
    // Use httpClient directly for reliable endpoint access
    
    await httpClient.delete(`/scheduling/quarters/${id}`)
  },

  /**
   * Activate quarter
   * TODO: Implement backend endpoint for quarter activation
   */
  async activateQuarter(id: number): Promise<Quarter> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Quarter activation endpoint not yet implemented'))
  },

  /**
   * Check if quarter+year combination already exists
   */
  async checkQuarterExists(quarterNumber: number, academicYear: number, excludeId?: number): Promise<boolean> {
    try {
      const filters: QuarterFilters = {
        academic_year: academicYear
      }
      
      const response = await this.getQuarters(filters)
      
      // Check if any quarter has the same quarter_number and academic_year
      const duplicateExists = response.quarters.some(quarter => 
        quarter.quarter_number === quarterNumber && 
        quarter.academic_year === academicYear &&
        (excludeId ? quarter.quarter_id !== excludeId : true)
      )
      
      return duplicateExists
    } catch (error) {
      // If there's an error getting quarters, assume it doesn't exist to avoid blocking creation
      console.warn('Error checking quarter existence:', error)
      return false
    }
  },

  /**
   * Validate quarter data
   * TODO: Implement backend endpoint for quarter validation
   */
  async validateQuarter(data: CreateQuarterRequest): Promise<QuarterValidation> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Quarter validation endpoint not yet implemented'))
  }
}

/**
 * Time Block Management Services
 */
export const timeBlockService = {
  /**
   * Get all time blocks with optional filters
   */
  async getTimeBlocks(filters?: TimeBlockFilters): Promise<TimeBlocksResponse> {
    const params = new URLSearchParams()
    
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString())
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }
    
    const query = params.toString() ? `?${params.toString()}` : ''
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.get<{
      items: TimeBlock[]
      total: number
    }>(`/scheduling/time-blocks${query}`)
    
    // Transform response to match expected format
    return {
      time_blocks: response.data.items,
      total: response.data.total
    }
  },

  /**
   * Get time block by ID
   */
  async getTimeBlock(id: number): Promise<TimeBlock> {
    const response = await enhancedApiService.get<TimeBlock>(
      `/scheduling/time-blocks/${id}`,
      {
        context: { module: 'academic-config', operation: 'get_time_block' }
      }
    )
    
    return response.data!
  },

  /**
   * Create new time block
   */
  async createTimeBlock(data: CreateTimeBlockRequest): Promise<TimeBlock> {
    const response = await enhancedApiService.post<TimeBlock>(
      '/scheduling/time-blocks',
      data,
      {
        context: { module: 'academic-config', operation: 'create_time_block' }
      }
    )
    
    return response.data!
  },

  /**
   * Update time block
   */
  async updateTimeBlock(id: number, data: UpdateTimeBlockRequest): Promise<TimeBlock> {
    const response = await enhancedApiService.put<TimeBlock>(
      `/scheduling/time-blocks/${id}`,
      data,
      {
        context: { module: 'academic-config', operation: 'update_time_block' }
      }
    )
    
    return response.data!
  },

  /**
   * Delete time block
   */
  async deleteTimeBlock(id: number): Promise<void> {
    await enhancedApiService.delete(
      `/scheduling/time-blocks/${id}`,
      {
        context: { module: 'academic-config', operation: 'delete_time_block' }
      }
    )
  }
}

/**
 * Day Configuration Services
 */
export const dayConfigService = {
  /**
   * Get all day configurations
   */
  async getDayConfigs(): Promise<DaysResponse> {
    // Use httpClient directly for reliable endpoint access
    
    const response = await httpClient.get<DayConfig[]>('/scheduling/days')
    
    // Transform response to match expected format
    return {
      days: response.data,
      total: response.data.length
    }
  },

  /**
   * Update day configuration
   */
  async updateDayConfig(id: number, data: UpdateDayConfigRequest): Promise<DayConfig> {
    const response = await enhancedApiService.put<DayConfig>(
      `/scheduling/days/${id}`,
      data,
      {
        context: { module: 'academic-config', operation: 'update_day_config' }
      }
    )
    
    return response.data!
  }
}

/**
 * General Configuration Services
 * TODO: Implement backend endpoints for configuration settings
 */
export const configurationService = {
  /**
   * Get all configuration settings
   */
  async getConfiguration(): Promise<ConfigurationResponse> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Configuration endpoints not yet implemented'))
  },

  /**
   * Update configuration setting
   */
  async updateConfiguration(data: UpdateConfigRequest[]): Promise<ConfigurationResponse> {
    // TODO: Implement when backend endpoint is available  
    return Promise.reject(new Error('Configuration endpoints not yet implemented'))
  },

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(): Promise<ConfigurationResponse> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Configuration endpoints not yet implemented'))
  }
}

/**
 * Quarter Transition Services
 * TODO: Implement backend endpoints for quarter transitions
 */
export const transitionService = {
  /**
   * Preview quarter transition
   */
  async previewTransition(data: QuarterTransition): Promise<TransitionSummary> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Transition endpoints not yet implemented'))
  },

  /**
   * Execute quarter transition
   */
  async executeTransition(data: QuarterTransition): Promise<TransitionSummary> {
    // TODO: Implement when backend endpoint is available
    return Promise.reject(new Error('Transition endpoints not yet implemented'))
  }
}

// Default export
export default {
  quarter: quarterService,
  timeBlock: timeBlockService,
  dayConfig: dayConfigService,
  configuration: configurationService,
  transition: transitionService
}